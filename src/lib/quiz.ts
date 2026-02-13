import { prisma } from '@/lib/db'
import { ErrorCode } from '@/lib/api-response'

// =============================================================================
// TYPES
// =============================================================================

/** Validation error codes for quiz prerequisites */
export type QuizValidationError =
    | 'ENROLLMENT_NOT_FOUND'
    | 'DAY_INVALID'
    | 'DAY_LOCKED'
    | 'COOLDOWN_ACTIVE'
    | 'ALREADY_PASSED'
    | 'ENROLLMENT_INACTIVE'

/** Result of quiz prerequisite validation */
export interface QuizValidation {
    readonly valid: boolean
    readonly error?: QuizValidationError
    /** If cooldown is active, when it expires */
    readonly cooldownUntil?: Date
    /** Human-readable reason for rejection */
    readonly message?: string
}

/** Score breakdown after grading answers */
export interface QuizScore {
    readonly score: number
    readonly percentage: number
    readonly correct: number
    readonly total: number
}

/** Final result after a fully processed quiz submission */
export interface QuizSubmissionResult {
    readonly passed: boolean
    readonly score: number
    readonly percentage: number
    readonly nextDayUnlocked: boolean
    readonly cooldownUntil: Date | null
    readonly attemptNumber: number
    readonly dayNumber: number
    readonly enrollmentId: string
}

/** System-configurable quiz parameters */
export interface QuizConfig {
    /** Number of correct answers required to pass (default 4/5) */
    readonly passScore: number
    /** Minutes of cooldown after every N failures (default 30) */
    readonly cooldownMinutes: number
    /** Cooldown triggers every N failed attempts (default 3) */
    readonly attemptsBetweenCooldown: number
    /** Total days in the program (default 7) */
    readonly totalDays: number
    /** Days to complete final project after Day 7 pass (default 7) */
    readonly submissionDeadlineDays: number
    /** Number of answer choices per quiz (default 5) */
    readonly expectedAnswerCount: number
}

/** Structured error for quiz operations */
export class QuizError extends Error {
    readonly code: string
    readonly enrollmentId: string
    readonly dayNumber: number

    constructor(
        message: string,
        code: string,
        enrollmentId: string,
        dayNumber: number,
    ) {
        super(message)
        this.name = 'QuizError'
        this.code = code
        this.enrollmentId = enrollmentId
        this.dayNumber = dayNumber

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, QuizError)
        }
    }
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_CONFIG: QuizConfig = {
    passScore: 4,
    cooldownMinutes: 30,
    attemptsBetweenCooldown: 3,
    totalDays: 7,
    submissionDeadlineDays: 7,
    expectedAnswerCount: 5,
}

// =============================================================================
// CONFIG LOADER (from SystemSetting table)
// =============================================================================

/**
 * Load quiz configuration from the `system_settings` table.
 * Falls back to `DEFAULT_CONFIG` for any missing keys.
 *
 * Expected keys: `quiz_pass_score`, `quiz_cooldown_minutes`,
 * `quiz_cooldown_attempts`, `quiz_total_days`, `quiz_submission_deadline_days`,
 * `quiz_expected_answer_count`
 *
 * @example
 * ```ts
 * const config = await getQuizConfig()
 * // { passScore: 4, cooldownMinutes: 30, ... }
 * ```
 */
export async function getQuizConfig(): Promise<QuizConfig> {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                settingKey: {
                    in: [
                        'quiz_pass_score',
                        'quiz_cooldown_minutes',
                        'quiz_cooldown_attempts',
                        'quiz_total_days',
                        'quiz_submission_deadline_days',
                        'quiz_expected_answer_count',
                    ],
                },
            },
        })

        const settingsMap = new Map(
            settings.map((s) => [s.settingKey, s.settingValue]),
        )

        return {
            passScore: asNumber(settingsMap.get('quiz_pass_score'), DEFAULT_CONFIG.passScore),
            cooldownMinutes: asNumber(settingsMap.get('quiz_cooldown_minutes'), DEFAULT_CONFIG.cooldownMinutes),
            attemptsBetweenCooldown: asNumber(settingsMap.get('quiz_cooldown_attempts'), DEFAULT_CONFIG.attemptsBetweenCooldown),
            totalDays: asNumber(settingsMap.get('quiz_total_days'), DEFAULT_CONFIG.totalDays),
            submissionDeadlineDays: asNumber(settingsMap.get('quiz_submission_deadline_days'), DEFAULT_CONFIG.submissionDeadlineDays),
            expectedAnswerCount: asNumber(settingsMap.get('quiz_expected_answer_count'), DEFAULT_CONFIG.expectedAnswerCount),
        }
    } catch (error) {
        console.warn('[Quiz] Failed to load config from DB, using defaults:', error)
        return DEFAULT_CONFIG
    }
}

// =============================================================================
// 1. VALIDATE QUIZ PREREQUISITES
// =============================================================================

/**
 * Validate that a student can attempt a quiz for a specific day.
 *
 * Checks (in order):
 * 1. Enrollment exists and is active (payment success)
 * 2. Day number is valid (1–7)
 * 3. DailyProgress exists and day is unlocked
 * 4. Quiz not already passed (no retakes after passing)
 * 5. Cooldown has expired (if any)
 *
 * @param enrollmentId - The enrollment ID
 * @param dayNumber    - Day number (1–7)
 * @returns Validation result with error code if invalid
 *
 * @example
 * ```ts
 * const validation = await validateQuizPrerequisites(enrollmentId, 3)
 * if (!validation.valid) {
 *   return badRequest(validation.message, { code: validation.error })
 * }
 * ```
 */
export async function validateQuizPrerequisites(
    enrollmentId: string,
    dayNumber: number,
): Promise<QuizValidation> {
    const config = await getQuizConfig()

    // ─── 1. Validate day number ──────────────────────────────────────────
    if (dayNumber < 1 || dayNumber > config.totalDays || !Number.isInteger(dayNumber)) {
        return {
            valid: false,
            error: 'DAY_INVALID',
            message: `Day number must be between 1 and ${config.totalDays}`,
        }
    }

    // ─── 2. Check enrollment exists and is active ────────────────────────
    const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: {
            id: true,
            paymentStatus: true,
            deletedAt: true,
        },
    })

    if (!enrollment || enrollment.deletedAt) {
        return {
            valid: false,
            error: 'ENROLLMENT_NOT_FOUND',
            message: 'Enrollment not found or has been deactivated',
        }
    }

    if (enrollment.paymentStatus !== 'success') {
        return {
            valid: false,
            error: 'ENROLLMENT_INACTIVE',
            message: 'Enrollment payment has not been completed',
        }
    }

    // ─── 3. Check daily progress ─────────────────────────────────────────
    const progress = await prisma.dailyProgress.findUnique({
        where: {
            enrollmentId_dayNumber: {
                enrollmentId,
                dayNumber,
            },
        },
    })

    if (!progress) {
        return {
            valid: false,
            error: 'DAY_LOCKED',
            message: `Day ${dayNumber} progress record does not exist`,
        }
    }

    if (progress.isLocked) {
        return {
            valid: false,
            error: 'DAY_LOCKED',
            message: `Day ${dayNumber} is still locked. Complete the previous day first.`,
        }
    }

    // ─── 4. Check if already passed ──────────────────────────────────────
    if (progress.quizPassed) {
        return {
            valid: false,
            error: 'ALREADY_PASSED',
            message: `You have already passed the Day ${dayNumber} quiz`,
        }
    }

    // ─── 5. Check cooldown ───────────────────────────────────────────────
    if (progress.quizCooldownUntil && progress.quizCooldownUntil > new Date()) {
        return {
            valid: false,
            error: 'COOLDOWN_ACTIVE',
            cooldownUntil: progress.quizCooldownUntil,
            message: `Cooldown active until ${progress.quizCooldownUntil.toISOString()}. Please wait before retrying.`,
        }
    }

    return { valid: true }
}

// =============================================================================
// 2. CALCULATE QUIZ SCORE
// =============================================================================

/**
 * Grade a quiz by comparing user answers against correct answers.
 *
 * @param userAnswers    - Student's submitted answers (e.g. `['B', 'A', 'C', 'D', 'A']`)
 * @param correctAnswers - Correct answers for the quiz
 * @returns Score breakdown
 *
 * @example
 * ```ts
 * const score = calculateQuizScore(
 *   ['B', 'A', 'C', 'D', 'A'],
 *   ['B', 'A', 'C', 'B', 'A'],
 * )
 * // { score: 4, percentage: 80, correct: 4, total: 5 }
 * ```
 */
export function calculateQuizScore(
    userAnswers: readonly string[],
    correctAnswers: readonly string[],
): QuizScore {
    if (correctAnswers.length === 0) {
        throw new Error('Correct answers array cannot be empty')
    }

    const total = correctAnswers.length
    let correct = 0

    for (let i = 0; i < total; i++) {
        const userAnswer = userAnswers[i]
        const correctAnswer = correctAnswers[i]

        if (
            userAnswer !== undefined &&
            correctAnswer !== undefined &&
            userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase()
        ) {
            correct++
        }
    }

    return {
        score: correct,
        percentage: Math.round((correct / total) * 100),
        correct,
        total,
    }
}

// =============================================================================
// 3. SUBMIT QUIZ (Atomic Transaction)
// =============================================================================

/**
 * Submit and process a quiz attempt in a single atomic Prisma transaction.
 *
 * This function orchestrates the entire quiz state machine:
 *
 * ```
 * LOCKED → UNLOCK → ATTEMPT → [pass?]
 *                                ├─ YES → MARK PASSED → UNLOCK NEXT DAY → (Day 7? set deadline)
 *                                └─ NO  → attempts++ → [attempts % 3 == 0?]
 *                                                        ├─ YES → COOLDOWN 30min
 *                                                        └─ NO  → can retry immediately
 * ```
 *
 * **Atomicity**: Every database mutation happens inside `prisma.$transaction`.
 * If any step fails, all changes are rolled back.
 *
 * **Idempotency**: The `quizAttempts` counter and `quizPassed` flag prevent
 * double-processing. Prerequisites are validated before the transaction begins.
 *
 * @param enrollmentId  - Enrollment ID
 * @param dayNumber     - Day number (1–7)
 * @param userAnswers   - Student's answers (exactly 5 strings)
 * @param correctAnswers - Correct answers for this day's quiz
 * @returns Full submission result
 *
 * @example
 * ```ts
 * const result = await submitQuiz(
 *   'enroll_abc',
 *   3,
 *   ['B', 'A', 'C', 'D', 'A'],
 *   ['B', 'A', 'C', 'B', 'A'],
 * )
 *
 * if (result.passed) {
 *   console.log('Next day unlocked:', result.nextDayUnlocked)
 * } else if (result.cooldownUntil) {
 *   console.log('Cooldown until:', result.cooldownUntil)
 * }
 * ```
 */
export async function submitQuiz(
    enrollmentId: string,
    dayNumber: number,
    userAnswers: readonly string[],
    correctAnswers: readonly string[],
): Promise<QuizSubmissionResult> {
    const config = await getQuizConfig()

    // ─── Input validation ────────────────────────────────────────────────
    if (userAnswers.length !== config.expectedAnswerCount) {
        throw new QuizError(
            `Expected exactly ${config.expectedAnswerCount} answers, received ${userAnswers.length}`,
            ErrorCode.VALIDATION_ERROR,
            enrollmentId,
            dayNumber,
        )
    }

    if (userAnswers.some((a) => !a || a.trim().length === 0)) {
        throw new QuizError(
            'All answers must be non-empty strings',
            ErrorCode.VALIDATION_ERROR,
            enrollmentId,
            dayNumber,
        )
    }

    // ─── Validate prerequisites ──────────────────────────────────────────
    const validation = await validateQuizPrerequisites(enrollmentId, dayNumber)
    if (!validation.valid) {
        throw new QuizError(
            validation.message ?? `Quiz prerequisite failed: ${validation.error}`,
            validation.error ?? 'DAY_INVALID',
            enrollmentId,
            dayNumber,
        )
    }

    // ─── Calculate score ─────────────────────────────────────────────────
    const quizScore = calculateQuizScore(userAnswers, correctAnswers)
    const passed = quizScore.score >= config.passScore

    console.info('[Quiz] Graded:', {
        enrollmentId,
        dayNumber,
        score: quizScore.score,
        required: config.passScore,
        passed,
    })

    // ─── Atomic transaction ──────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
        // Re-read inside transaction for optimistic locking
        const progress = await tx.dailyProgress.findUnique({
            where: {
                enrollmentId_dayNumber: {
                    enrollmentId,
                    dayNumber,
                },
            },
        })

        if (!progress) {
            throw new QuizError(
                'Daily progress not found inside transaction',
                'DAY_INVALID',
                enrollmentId,
                dayNumber,
            )
        }

        // Optimistic lock: re-check state hasn't changed since validation
        if (progress.quizPassed) {
            throw new QuizError(
                'Quiz was already passed (concurrent submission detected)',
                'ALREADY_PASSED',
                enrollmentId,
                dayNumber,
            )
        }

        if (progress.isLocked) {
            throw new QuizError(
                'Day was locked between validation and transaction (concurrent update)',
                'DAY_LOCKED',
                enrollmentId,
                dayNumber,
            )
        }

        const newAttemptCount = progress.quizAttempts + 1
        const now = new Date()

        // Calculate cooldown (only on failure, every N attempts)
        let cooldownUntil: Date | null = null
        if (
            !passed &&
            newAttemptCount % config.attemptsBetweenCooldown === 0
        ) {
            cooldownUntil = new Date(now.getTime() + config.cooldownMinutes * 60 * 1000)
        }

        // ─── Step 1: Update daily_progress ───────────────────────────────
        await tx.dailyProgress.update({
            where: { id: progress.id },
            data: {
                quizAttempted: true,
                quizScore: quizScore.score,
                quizAnswers: userAnswers as string[],
                quizPassed: passed,
                quizAttempts: newAttemptCount,
                quizCooldownUntil: cooldownUntil,
                completedAt: passed ? now : progress.completedAt,
            },
        })

        // ─── Step 2 (Passed): Unlock next day ────────────────────────────
        let nextDayUnlocked = false

        if (passed) {
            const nextDay = dayNumber + 1

            if (nextDay <= config.totalDays) {
                // Upsert next day's progress (unlock it)
                await tx.dailyProgress.upsert({
                    where: {
                        enrollmentId_dayNumber: {
                            enrollmentId,
                            dayNumber: nextDay,
                        },
                    },
                    create: {
                        enrollmentId,
                        dayNumber: nextDay,
                        isLocked: false,
                        unlockedAt: now,
                    },
                    update: {
                        isLocked: false,
                        unlockedAt: now,
                    },
                })

                nextDayUnlocked = true

                console.info('[Quiz] Unlocked next day:', {
                    enrollmentId,
                    nextDay,
                })
            }

            // Update enrollment's current day
            await tx.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    currentDay: Math.min(nextDay, config.totalDays),
                },
            })

            // ─── Step 3 (Day 7): Set project submission deadline ─────────
            if (dayNumber === config.totalDays) {
                const deadline = new Date(
                    now.getTime() + config.submissionDeadlineDays * 24 * 60 * 60 * 1000,
                )

                await tx.enrollment.update({
                    where: { id: enrollmentId },
                    data: {
                        day7Completed: true,
                        projectSubmissionDeadline: deadline,
                    },
                })

                console.info('[Quiz] Day 7 completed — submission deadline set:', {
                    enrollmentId,
                    deadline: deadline.toISOString(),
                })
            }

            // ─── Step 4: Create pass notification ────────────────────────
            const enrollment = await tx.enrollment.findUnique({
                where: { id: enrollmentId },
                select: { userId: true },
            })

            if (enrollment) {
                await tx.notification.create({
                    data: {
                        userId: enrollment.userId,
                        type: 'quiz_passed',
                        title: `Day ${dayNumber} Quiz Passed! 🎉`,
                        message: dayNumber === config.totalDays
                            ? `Congratulations! You've completed all ${config.totalDays} days. Your project submission window is now open.`
                            : `Great job! You scored ${quizScore.score}/${quizScore.total}. Day ${dayNumber + 1} is now unlocked.`,
                    },
                })
            }
        } else if (cooldownUntil) {
            // ─── Cooldown notification ───────────────────────────────────
            const enrollment = await tx.enrollment.findUnique({
                where: { id: enrollmentId },
                select: { userId: true },
            })

            if (enrollment) {
                await tx.notification.create({
                    data: {
                        userId: enrollment.userId,
                        type: 'quiz_cooldown',
                        title: `Cooldown Active ⏳`,
                        message: `You've used ${newAttemptCount} attempts on Day ${dayNumber}. Take a ${config.cooldownMinutes}-minute break before retrying.`,
                    },
                })
            }
        }

        return {
            passed,
            score: quizScore.score,
            percentage: quizScore.percentage,
            nextDayUnlocked,
            cooldownUntil,
            attemptNumber: newAttemptCount,
            dayNumber,
            enrollmentId,
        }
    })

    console.info('[Quiz] Submission processed:', {
        enrollmentId,
        dayNumber,
        passed: result.passed,
        score: result.score,
        attempt: result.attemptNumber,
        cooldownUntil: result.cooldownUntil?.toISOString() ?? null,
        nextDayUnlocked: result.nextDayUnlocked,
    })

    return result
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get quiz progress summary for a student's enrollment.
 * Useful for the student dashboard.
 *
 * @example
 * ```ts
 * const progress = await getQuizProgress('enroll_abc')
 * // [{ dayNumber: 1, passed: true, attempts: 2, locked: false }, ...]
 * ```
 */
export async function getQuizProgress(enrollmentId: string): Promise<
    Array<{
        dayNumber: number
        isLocked: boolean
        quizPassed: boolean
        quizScore: number
        quizAttempts: number
        cooldownUntil: Date | null
        completedAt: Date | null
    }>
> {
    const progress = await prisma.dailyProgress.findMany({
        where: { enrollmentId },
        orderBy: { dayNumber: 'asc' },
        select: {
            dayNumber: true,
            isLocked: true,
            quizPassed: true,
            quizScore: true,
            quizAttempts: true,
            quizCooldownUntil: true,
            completedAt: true,
        },
    })

    return progress.map((p) => ({
        dayNumber: p.dayNumber,
        isLocked: p.isLocked,
        quizPassed: p.quizPassed,
        quizScore: p.quizScore,
        quizAttempts: p.quizAttempts,
        cooldownUntil: p.quizCooldownUntil,
        completedAt: p.completedAt,
    }))
}

/**
 * Initialize daily progress records for a new enrollment.
 * Called once after successful payment — creates all 7 days with
 * Day 1 unlocked and Days 2–7 locked.
 *
 * @param enrollmentId - The newly created enrollment ID
 *
 * @example
 * ```ts
 * await initializeDailyProgress('enroll_abc')
 * ```
 */
export async function initializeDailyProgress(enrollmentId: string): Promise<void> {
    const config = await getQuizConfig()

    const records = Array.from({ length: config.totalDays }, (_, i) => ({
        enrollmentId,
        dayNumber: i + 1,
        isLocked: i !== 0, // Day 1 is unlocked, rest are locked
        unlockedAt: i === 0 ? new Date() : null,
    }))

    await prisma.dailyProgress.createMany({
        data: records,
        skipDuplicates: true, // Idempotent — safe to call multiple times
    })

    console.info('[Quiz] Initialized daily progress:', {
        enrollmentId,
        days: config.totalDays,
    })
}

/**
 * Check if a cooldown is currently active for a specific day.
 *
 * @example
 * ```ts
 * const cooldown = await getCooldownStatus('enroll_abc', 3)
 * if (cooldown.active) {
 *   console.log('Wait until:', cooldown.expiresAt)
 * }
 * ```
 */
export async function getCooldownStatus(
    enrollmentId: string,
    dayNumber: number,
): Promise<{ active: boolean; expiresAt: Date | null; remainingSeconds: number }> {
    const progress = await prisma.dailyProgress.findUnique({
        where: {
            enrollmentId_dayNumber: { enrollmentId, dayNumber },
        },
        select: { quizCooldownUntil: true },
    })

    if (!progress?.quizCooldownUntil) {
        return { active: false, expiresAt: null, remainingSeconds: 0 }
    }

    const now = new Date()
    const remaining = Math.max(0, progress.quizCooldownUntil.getTime() - now.getTime())

    return {
        active: remaining > 0,
        expiresAt: progress.quizCooldownUntil,
        remainingSeconds: Math.ceil(remaining / 1000),
    }
}

// =============================================================================
// INTERNAL UTILITIES
// =============================================================================

/** Safely extract a number from a Json field with a fallback */
function asNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) return parsed
    }
    // Handle Prisma Json fields which may be wrapped objects
    if (value !== null && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
        return asNumber((value as Record<string, unknown>).value, fallback)
    }
    return fallback
}
