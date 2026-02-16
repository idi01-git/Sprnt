import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { getCooldownStatus } from '@/lib/quiz'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/quiz/{moduleId}/status
 * Get quiz status: attempts, score, passed, cooldown info.
 * Query: ?enrollmentId=<enrollmentId>
 * Auth: Session Cookie
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
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

        const { moduleId } = await params
        const { searchParams } = new URL(request.url)
        const enrollmentId = searchParams.get('enrollmentId')

        if (!enrollmentId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'enrollmentId query parameter is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // Verify enrollment ownership
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { userId: true },
        })

        if (!enrollment || enrollment.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Access denied',
                HttpStatus.FORBIDDEN
            )
        }

        // Get module to find dayNumber
        const courseModule = await prisma.courseModule.findUnique({
            where: { id: moduleId },
            select: { dayNumber: true },
        })

        if (!courseModule) {
            return createErrorResponse(
                ErrorCode.QUIZ_NOT_FOUND,
                'Module not found',
                HttpStatus.NOT_FOUND
            )
        }

        // Get daily progress for this day
        const progress = await prisma.dailyProgress.findUnique({
            where: {
                enrollmentId_dayNumber: {
                    enrollmentId,
                    dayNumber: courseModule.dayNumber,
                },
            },
            select: {
                isLocked: true,
                quizAttempted: true,
                quizScore: true,
                quizPassed: true,
                quizAttempts: true,
                quizCooldownUntil: true,
            },
        })

        // Get cooldown status
        const cooldown = await getCooldownStatus(enrollmentId, courseModule.dayNumber)

        return createSuccessResponse({
            moduleId,
            dayNumber: courseModule.dayNumber,
            status: {
                isLocked: progress?.isLocked ?? true,
                attempted: progress?.quizAttempted ?? false,
                passed: progress?.quizPassed ?? false,
                score: progress?.quizScore ?? 0,
                attempts: progress?.quizAttempts ?? 0,
                cooldown: {
                    active: cooldown.active,
                    expiresAt: cooldown.expiresAt,
                    remainingSeconds: cooldown.remainingSeconds,
                },
            },
        })
    } catch (error) {
        console.error('[GET /api/quiz/[moduleId]/status]', error)
        return serverError('Failed to fetch quiz status')
    }
}
