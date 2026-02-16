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
 * GET /api/certificates
 * List all certificates for the authenticated user.
 * Auth: Session Cookie
 */
export async function GET(_request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const certificates = await prisma.certificate.findMany({
            where: {
                userId: user.id,
                isRevoked: false,
            },
            select: {
                id: true,
                certificateId: true,
                courseName: true,
                studentName: true,
                collegeName: true,
                grade: true,
                certificateUrl: true,
                issuedAt: true,
                enrollment: {
                    select: {
                        course: {
                            select: {
                                slug: true,
                                courseThumbnail: true,
                            },
                        },
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        })

        const formattedCerts = certificates.map((c) => ({
            id: c.id,
            certificateId: c.certificateId,
            courseName: c.courseName,
            courseSlug: c.enrollment.course.slug,
            courseThumbnail: c.enrollment.course.courseThumbnail,
            studentName: c.studentName,
            collegeName: c.collegeName,
            grade: c.grade,
            certificateUrl: c.certificateUrl,
            issuedAt: c.issuedAt,
        }))

        return createSuccessResponse({
            certificates: formattedCerts,
            total: formattedCerts.length,
        })
    } catch (error) {
        console.error('[GET /api/certificates]', error)
        return serverError('Failed to fetch certificates')
    }
}
