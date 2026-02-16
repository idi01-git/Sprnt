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
 * GET /api/enrollments/{enrollmentId}
 * Get full enrollment detail: course info, current day, payment info,
 * submission status, certificate status.
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

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                amountPaid: true,
                promocodeUsed: true,
                discountAmount: true,
                currentDay: true,
                day7Completed: true,
                projectSubmissionDeadline: true,
                certificateIssued: true,
                certificateUrl: true,
                enrolledAt: true,
                completedAt: true,
                course: {
                    select: {
                        courseName: true,
                        slug: true,
                        coursePrice: true,
                        courseThumbnail: true,
                        affiliatedBranch: true,
                        problemStatementText: true,
                        _count: { select: { modules: true } },
                    },
                },
                submission: {
                    select: {
                        id: true,
                        reviewStatus: true,
                        gradeCategory: true,
                        finalGrade: true,
                        submittedAt: true,
                        resubmissionCount: true,
                        maxResubmissions: true,
                    },
                },
                _count: {
                    select: {
                        dailyProgress: { where: { quizPassed: true } },
                    },
                },
            },
        })

        if (!enrollment) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_NOT_FOUND,
                'Enrollment not found',
                HttpStatus.NOT_FOUND
            )
        }

        // Verify ownership
        if (enrollment.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'You do not have access to this enrollment',
                HttpStatus.FORBIDDEN
            )
        }

        return createSuccessResponse({
            enrollment: {
                id: enrollment.id,
                courseId: enrollment.courseId,
                courseName: enrollment.course.courseName,
                courseSlug: enrollment.course.slug,
                coursePrice: Number(enrollment.course.coursePrice),
                courseThumbnail: enrollment.course.courseThumbnail,
                affiliatedBranch: enrollment.course.affiliatedBranch,
                totalModules: enrollment.course._count.modules,
                paymentStatus: enrollment.paymentStatus,
                amountPaid: Number(enrollment.amountPaid),
                promocodeUsed: enrollment.promocodeUsed,
                discountAmount: Number(enrollment.discountAmount),
                currentDay: enrollment.currentDay,
                day7Completed: enrollment.day7Completed,
                daysCompleted: enrollment._count.dailyProgress,
                projectSubmissionDeadline: enrollment.projectSubmissionDeadline,
                certificateIssued: enrollment.certificateIssued,
                certificateUrl: enrollment.certificateUrl,
                enrolledAt: enrollment.enrolledAt,
                completedAt: enrollment.completedAt,
                status: enrollment.completedAt ? 'completed' : 'in_progress',
                submission: enrollment.submission
                    ? {
                        id: enrollment.submission.id,
                        reviewStatus: enrollment.submission.reviewStatus,
                        gradeCategory: enrollment.submission.gradeCategory,
                        finalGrade: enrollment.submission.finalGrade
                            ? Number(enrollment.submission.finalGrade)
                            : null,
                        submittedAt: enrollment.submission.submittedAt,
                        resubmissionCount: enrollment.submission.resubmissionCount,
                        maxResubmissions: enrollment.submission.maxResubmissions,
                    }
                    : null,
            },
        })
    } catch (error) {
        console.error('[GET /api/enrollments/[enrollmentId]]', error)
        return serverError('Failed to fetch enrollment details')
    }
}
