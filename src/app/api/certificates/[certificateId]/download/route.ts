import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { generatePresignedDownloadUrl, Bucket, Expiry } from '@/lib/r2'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/certificates/{certificateId}/download
 * Generate a presigned download URL for the certificate PDF.
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
                certificateUrl: true,
                isRevoked: true,
                userId: true,
                courseName: true,
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

        // certificateUrl could be a full URL or an R2 key
        // If it starts with http, it's already a public URL
        if (certificate.certificateUrl.startsWith('http')) {
            return createSuccessResponse({
                downloadUrl: certificate.certificateUrl,
                fileName: `${certificate.courseName}_Certificate.pdf`,
            })
        }

        // Generate presigned download URL from R2
        const { url, expiresAt } = await generatePresignedDownloadUrl(
            Bucket.PRIVATE,
            certificate.certificateUrl,
            Expiry.DOWNLOAD
        )

        return createSuccessResponse({
            downloadUrl: url,
            expiresAt,
            fileName: `${certificate.courseName}_Certificate.pdf`,
        })
    } catch (error) {
        console.error('[GET /api/certificates/[certificateId]/download]', error)
        return serverError('Failed to generate download URL')
    }
}
