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
 * GET /api/video/{videoAssetId}/signed-url
 * Generate a presigned streaming URL for a video asset (4hr expiry).
 * Auth: Session Cookie (must be enrolled in the course that owns this video)
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ videoAssetId: string }> }
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

        const { videoAssetId } = await params

        if (!videoAssetId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Video asset ID is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // Fetch video asset with its parent module → course
        const videoAsset = await prisma.videoAsset.findUnique({
            where: { id: videoAssetId },
            select: {
                id: true,
                r2Key: true,
                r2Bucket: true,
                durationSeconds: true,
                uploadStatus: true,
                courseModule: {
                    select: {
                        courseId: true,
                        dayNumber: true,
                        isFreePreview: true,
                    },
                },
            },
        })

        if (!videoAsset || videoAsset.uploadStatus !== 'completed') {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Video not found or not ready',
                HttpStatus.NOT_FOUND
            )
        }

        // Allow free preview without enrollment check
        if (!videoAsset.courseModule.isFreePreview) {
            // Check enrollment
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: user.id,
                    courseId: videoAsset.courseModule.courseId,
                    paymentStatus: 'success',
                    deletedAt: null,
                },
                select: { id: true },
            })

            if (!enrollment) {
                return createErrorResponse(
                    ErrorCode.ENROLLMENT_ACCESS_DENIED,
                    'You must be enrolled in this course to view this video',
                    HttpStatus.FORBIDDEN
                )
            }

            // Check day is unlocked (skip for day 1)
            if (videoAsset.courseModule.dayNumber > 1) {
                const progress = await prisma.dailyProgress.findFirst({
                    where: {
                        enrollmentId: enrollment.id,
                        dayNumber: videoAsset.courseModule.dayNumber,
                        isLocked: false,
                    },
                    select: { id: true },
                })

                if (!progress) {
                    return createErrorResponse(
                        ErrorCode.ENROLLMENT_ACCESS_DENIED,
                        `Day ${videoAsset.courseModule.dayNumber} is locked`,
                        HttpStatus.FORBIDDEN
                    )
                }
            }
        }

        // Generate presigned URL (4hr for video streaming)
        const bucket = videoAsset.r2Bucket || Bucket.PRIVATE
        const { url, expiresAt } = await generatePresignedDownloadUrl(
            bucket,
            videoAsset.r2Key,
            Expiry.VIDEO
        )

        return createSuccessResponse({
            videoAssetId: videoAsset.id,
            url,
            expiresAt,
            durationSeconds: videoAsset.durationSeconds,
        })
    } catch (error) {
        console.error('[GET /api/video/[videoAssetId]/signed-url]', error)
        return serverError('Failed to generate video URL')
    }
}
