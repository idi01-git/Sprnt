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

const uploadUrlSchema = z.object({
    enrollmentId: z.string().min(1),
    fileType: z.enum(['project', 'report']),
    contentType: z.string().min(1),
    fileName: z.string().min(1),
})

/**
 * POST /api/submissions/upload-url
 * Generate a presigned upload URL for project file or report PDF.
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
        const result = uploadUrlSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { enrollmentId, fileType, contentType, fileName } = result.data

        // Verify enrollment ownership + day7 completed
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

        if (!enrollment.day7Completed) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Complete all 7 days before submitting a project',
                HttpStatus.FORBIDDEN
            )
        }

        // Generate a unique key for the upload
        const ext = fileName.split('.').pop() || 'bin'
        const timestamp = Date.now()
        const key = `${KeyPrefix.SUBMISSIONS}${enrollmentId}/${fileType}_${timestamp}.${ext}`

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
        console.error('[POST /api/submissions/upload-url]', error)
        return serverError('Failed to generate upload URL')
    }
}
