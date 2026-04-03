import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { validateQuizPrerequisites } from '@/lib/quiz'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/quiz/{moduleId}
 * Get quiz questions for a course module (strip correct answers).
 * Questions fetched from quiz_questions table.
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

        // Get the module
        const courseModule = await prisma.courseModule.findUnique({
            where: { id: moduleId },
            select: {
                id: true,
                courseId: true,
                dayNumber: true,
                title: true,
            },
        })

        if (!courseModule) {
            return createErrorResponse(
                ErrorCode.QUIZ_NOT_FOUND,
                'Quiz not found for this module',
                HttpStatus.NOT_FOUND
            )
        }

        // Validate quiz prerequisites
        const validation = await validateQuizPrerequisites(
            enrollmentId,
            courseModule.dayNumber
        )

        if (!validation.valid) {
            return createErrorResponse(
                validation.error === 'ALREADY_PASSED'
                    ? ErrorCode.QUIZ_ALREADY_SUBMITTED
                    : validation.error === 'COOLDOWN_ACTIVE'
                        ? ErrorCode.QUIZ_TIME_EXPIRED
                        : ErrorCode.ENROLLMENT_ACCESS_DENIED,
                validation.message ?? 'Quiz prerequisites not met',
                HttpStatus.FORBIDDEN,
                validation.cooldownUntil
                    ? { cooldownUntil: validation.cooldownUntil }
                    : undefined
            )
        }

        // Fetch questions from quiz_questions table
        const quizQuestions = await prisma.quizQuestion.findMany({
            where: { moduleId },
            select: {
                id: true,
                questionText: true,
                options: true,
            },
            orderBy: { orderIndex: 'asc' },
        })

        const questions = quizQuestions.map((q, index) => ({
            id: index + 1,
            question: q.questionText,
            options: q.options as string[],
        }))

        return createSuccessResponse({
            quiz: {
                moduleId: courseModule.id,
                dayNumber: courseModule.dayNumber,
                title: courseModule.title,
                questions,
                totalQuestions: questions.length,
            },
        })
    } catch (error) {
        console.error('[GET /api/quiz/[moduleId]]', error)
        return serverError('Failed to fetch quiz questions')
    }
}