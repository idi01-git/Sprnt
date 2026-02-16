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
 * GET /api/learn/{enrollmentId}/problem-statement
 * Return the problem statement PDF URL and text for the project.
 * Auth: Session Cookie (owner only, day 7 must be completed)
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

        // Verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                day7Completed: true,
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
                'Access denied',
                HttpStatus.FORBIDDEN
            )
        }

        if (enrollment.paymentStatus !== 'success') {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Payment not completed',
                HttpStatus.FORBIDDEN
            )
        }

        if (!enrollment.day7Completed) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Complete all 7 days before accessing the problem statement',
                HttpStatus.FORBIDDEN
            )
        }

        // Get problem statement from course
        const course = await prisma.course.findUnique({
            where: { id: enrollment.courseId },
            select: {
                problemStatementText: true,
                problemStatementPdfUrl: true,
            },
        })

        if (!course?.problemStatementText && !course?.problemStatementPdfUrl) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Problem statement not available for this course',
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({
            enrollmentId: enrollment.id,
            problemStatementText: course.problemStatementText,
            problemStatementPdfUrl: course.problemStatementPdfUrl,
        })
    } catch (error) {
        console.error('[GET /api/learn/[enrollmentId]/problem-statement]', error)
        return serverError('Failed to fetch problem statement')
    }
}
