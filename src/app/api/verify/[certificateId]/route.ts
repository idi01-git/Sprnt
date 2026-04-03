import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/verify/{certificateId}
 * Public endpoint: Verify a certificate by its ID (from QR scan).
 * No auth required — this is public-facing.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { certificateId } = await params

        const enrollment = await prisma.enrollment.findFirst({
            where: { certificateId, certificateIssued: true },
            select: {
                certificateId: true,
                certificateIssued: true,
                completedAt: true,
                user: {
                    select: {
                        name: true,
                    },
                },
                course: {
                    select: {
                        courseName: true,
                        affiliatedBranch: true,
                    },
                },
                submission: {
                    select: {
                        gradeCategory: true,
                    },
                },
            },
        })

        if (!enrollment) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Certificate not found. This certificate ID does not exist.',
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({
            valid: enrollment.certificateIssued,
            certificate: {
                certificateId: enrollment.certificateId,
                studentName: enrollment.user.name,
                courseName: enrollment.course.courseName,
                branch: enrollment.course.affiliatedBranch,
                grade: enrollment.submission?.gradeCategory,
                issuedAt: enrollment.completedAt,
            },
        })
    } catch (error) {
        console.error('[GET /api/verify/[certificateId]]', error)
        return serverError('Failed to verify certificate')
    }
}
