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
 * GET /api/certificates/{certificateId}
 * Get detailed certificate information.
 * Auth: Session Cookie (owner only)
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ certificateId: string }> }
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

        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            select: {
                id: true,
                certificateId: true,
                studentName: true,
                collegeName: true,
                courseName: true,
                grade: true,
                certificateUrl: true,
                qrCodeData: true,
                isRevoked: true,
                issuedAt: true,
                userId: true,
                enrollment: {
                    select: {
                        id: true,
                        course: {
                            select: {
                                slug: true,
                                affiliatedBranch: true,
                            },
                        },
                        submission: {
                            select: {
                                finalGrade: true,
                                gradeCategory: true,
                                reviewCompletedAt: true,
                            },
                        },
                    },
                },
            },
        })

        if (!certificate) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Certificate not found',
                HttpStatus.NOT_FOUND
            )
        }

        if (certificate.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Access denied',
                HttpStatus.FORBIDDEN
            )
        }

        if (certificate.isRevoked) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'This certificate has been revoked',
                HttpStatus.GONE
            )
        }

        return createSuccessResponse({
            certificate: {
                id: certificate.id,
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                collegeName: certificate.collegeName,
                courseName: certificate.courseName,
                courseSlug: certificate.enrollment.course.slug,
                branch: certificate.enrollment.course.affiliatedBranch,
                grade: certificate.grade,
                certificateUrl: certificate.certificateUrl,
                qrCodeData: certificate.qrCodeData,
                issuedAt: certificate.issuedAt,
                submission: certificate.enrollment.submission
                    ? {
                        finalGrade: certificate.enrollment.submission.finalGrade
                            ? Number(certificate.enrollment.submission.finalGrade) : null,
                        gradeCategory: certificate.enrollment.submission.gradeCategory,
                        reviewCompletedAt: certificate.enrollment.submission.reviewCompletedAt,
                    }
                    : null,
            },
        })
    } catch (error) {
        console.error('[GET /api/certificates/[certificateId]]', error)
        return serverError('Failed to fetch certificate details')
    }
}
