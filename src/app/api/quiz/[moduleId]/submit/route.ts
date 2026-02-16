import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { submitQuiz, QuizError } from '@/lib/quiz'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

interface StoredQuestion {
    question: string
    options: string[]
    correctAnswer: string
}

const submitQuizSchema = z.object({
    enrollmentId: z.string().min(1),
    answers: z.array(z.string()).min(1),
})

/**
 * POST /api/quiz/{moduleId}/submit
 * Submit quiz answers for grading. Uses atomic transaction from quiz.ts.
 * Auth: Session Cookie
 */
export async function POST(
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
        const body = await request.json()
        const result = submitQuizSchema.safeParse(body)

        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { enrollmentId, answers } = result.data

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

        // Get the module and correct answers
        const courseModule = await prisma.courseModule.findUnique({
            where: { id: moduleId },
            select: {
                dayNumber: true,
                quizQuestions: true,
            },
        })

        if (!courseModule) {
            return createErrorResponse(
                ErrorCode.QUIZ_NOT_FOUND,
                'Quiz not found',
                HttpStatus.NOT_FOUND
            )
        }

        const storedQuestions = courseModule.quizQuestions as unknown as StoredQuestion[]
        const correctAnswers = storedQuestions.map((q) => q.correctAnswer)

        // Submit quiz via the atomic transaction handler
        const quizResult = await submitQuiz(
            enrollmentId,
            courseModule.dayNumber,
            answers,
            correctAnswers
        )

        return createSuccessResponse({
            passed: quizResult.passed,
            score: quizResult.score,
            percentage: quizResult.percentage,
            nextDayUnlocked: quizResult.nextDayUnlocked,
            cooldownUntil: quizResult.cooldownUntil,
            attemptNumber: quizResult.attemptNumber,
            dayNumber: quizResult.dayNumber,
        })
    } catch (error) {
        if (error instanceof QuizError) {
            return createErrorResponse(
                error.code,
                error.message,
                HttpStatus.BAD_REQUEST
            )
        }
        console.error('[POST /api/quiz/[moduleId]/submit]', error)
        return serverError('Failed to submit quiz')
    }
}
