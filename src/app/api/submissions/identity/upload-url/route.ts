import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { generatePresignedUploadUrl, Bucket, KeyPrefix } from '@/lib/r2'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

const identityUploadSchema = z.object({
    enrollmentId: z.string().min(1),
    contentType: z.string().min(1),
    fileName: z.string().min(1),
})

/**
 * POST /api/submissions/identity/upload-url
 * Generate presigned upload URL for identity verification document.
 * Auth: Session Cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const body = await request.json()
        const result = identityUploadSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { enrollmentId, contentType, fileName } = result.data

        // Verify enrollment ownership
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                paymentStatus: true,
            },
        })

        if (!enrollment || enrollment.userId !== user.id) {
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

        // Check that a submission exists for this enrollment
        const submission = await prisma.submission.findUnique({
            where: { enrollmentId },
            select: { id: true },
        })

        if (!submission) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Submit your project before uploading identity documents',
                HttpStatus.BAD_REQUEST
            )
        }

        const ext = fileName.split('.').pop() || 'bin'
        const timestamp = Date.now()
        const key = `${KeyPrefix.IDENTITY_DOCS}${enrollmentId}/${timestamp}.${ext}`

        const { url, expiresAt } = await generatePresignedUploadUrl(
            Bucket.PRIVATE,
            key,
            contentType
        )

        return createSuccessResponse({
            uploadUrl: url,
            key,
            expiresAt,
        })
    } catch (error) {
        console.error('[POST /api/submissions/identity/upload-url]', error)
        return serverError('Failed to generate upload URL')
    }
}
