import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/enrollments/{enrollmentId}/progress
 * Get all 7 days' progress: lock status, quiz status, scores, attempts,
 * cooldowns, completion timestamps.
 * Auth: Session Cookie (owner only)
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ enrollmentId: string }> }
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { enrollmentId } = await params

        if (!enrollmentId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Enrollment ID is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // Verify enrollment exists and belongs to the user
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                currentDay: true,
                paymentStatus: true,
            },
        })

        if (!enrollment) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_NOT_FOUND,
                'Enrollment not found',
                HttpStatus.NOT_FOUND
            )
        }

        if (enrollment.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'You do not have access to this enrollment',
                HttpStatus.FORBIDDEN
            )
        }

        // Get all daily progress records
        const dailyProgress = await prisma.dailyProgress.findMany({
            where: { enrollmentId: enrollment.id },
            select: {
                id: true,
                dayNumber: true,
                isLocked: true,
                unlockedAt: true,
                quizAttempted: true,
                quizScore: true,
                quizPassed: true,
                quizAttempts: true,
                quizCooldownUntil: true,
                startedAt: true,
                completedAt: true,
            },
            orderBy: { dayNumber: 'asc' },
        })

        // Build full 7-day progress map (fill missing days as locked)
        const progressMap = new Map(
            dailyProgress.map((dp) => [dp.dayNumber, dp])
        )

        const days = Array.from({ length: 7 }, (_, i) => {
            const dayNumber = i + 1
            const progress = progressMap.get(dayNumber)

            if (progress) {
                return {
                    dayNumber,
                    isLocked: progress.isLocked,
                    unlockedAt: progress.unlockedAt,
                    quizAttempted: progress.quizAttempted,
                    quizScore: progress.quizScore,
                    quizPassed: progress.quizPassed,
                    quizAttempts: progress.quizAttempts,
                    quizCooldownUntil: progress.quizCooldownUntil,
                    cooldownActive: progress.quizCooldownUntil
                        ? new Date() < progress.quizCooldownUntil
                        : false,
                    startedAt: progress.startedAt,
                    completedAt: progress.completedAt,
                }
            }

            // Day record doesn't exist yet — it's locked
            return {
                dayNumber,
                isLocked: true,
                unlockedAt: null,
                quizAttempted: false,
                quizScore: 0,
                quizPassed: false,
                quizAttempts: 0,
                quizCooldownUntil: null,
                cooldownActive: false,
                startedAt: null,
                completedAt: null,
            }
        })

        return createSuccessResponse({
            enrollmentId: enrollment.id,
            currentDay: enrollment.currentDay,
            progress: days,
        })
    } catch (error) {
        console.error('[GET /api/enrollments/[enrollmentId]/progress]', error)
        return serverError('Failed to fetch enrollment progress')
    }
}
