import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

const saveProgressSchema = z.object({
    enrollmentId: z.string().min(1),
    watchDurationSeconds: z.number().int().min(0),
    completionPercentage: z.number().min(0).max(100),
    lastPositionSeconds: z.number().int().min(0),
})

/**
 * POST /api/video/{videoAssetId}/progress
 * Save/update watch progress. Upsert on (userId, videoAssetId, enrollmentId).
 * Auth: Session Cookie
 */
export async function POST(
    request: NextRequest,
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
        const body = await request.json()
        const result = saveProgressSchema.safeParse(body)

        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { enrollmentId, watchDurationSeconds, completionPercentage, lastPositionSeconds } = result.data

        // Verify enrollment ownership
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { id: true, userId: true, paymentStatus: true },
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

        // Verify video asset exists
        const videoAsset = await prisma.videoAsset.findUnique({
            where: { id: videoAssetId },
            select: { id: true },
        })

        if (!videoAsset) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Video asset not found',
                HttpStatus.NOT_FOUND
            )
        }

        const completed = completionPercentage >= 90

        // Upsert the video view progress
        const videoView = await prisma.videoView.upsert({
            where: {
                userId_videoAssetId_enrollmentId: {
                    userId: user.id,
                    videoAssetId,
                    enrollmentId,
                },
            },
            create: {
                userId: user.id,
                videoAssetId,
                enrollmentId,
                watchDurationSeconds,
                completionPercentage,
                lastPositionSeconds,
                completed,
                lastWatchedAt: new Date(),
            },
            update: {
                watchDurationSeconds,
                completionPercentage,
                lastPositionSeconds,
                completed,
                lastWatchedAt: new Date(),
            },
            select: {
                id: true,
                watchDurationSeconds: true,
                completionPercentage: true,
                lastPositionSeconds: true,
                completed: true,
                lastWatchedAt: true,
            },
        })

        return createSuccessResponse({
            id: videoView.id,
            watchDurationSeconds: videoView.watchDurationSeconds,
            completionPercentage: Number(videoView.completionPercentage),
            lastPositionSeconds: videoView.lastPositionSeconds,
            completed: videoView.completed,
            lastWatchedAt: videoView.lastWatchedAt,
        })
    } catch (error) {
        console.error('[POST /api/video/[videoAssetId]/progress]', error)
        return serverError('Failed to save video progress')
    }
}

/**
 * GET /api/video/{videoAssetId}/progress
 * Get watch progress for a specific video asset.
 * Auth: Session Cookie
 */
export async function GET(
    request: NextRequest,
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
        const { searchParams } = new URL(request.url)
        const enrollmentId = searchParams.get('enrollmentId')

        if (!enrollmentId) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'enrollmentId query parameter is required',
                HttpStatus.BAD_REQUEST
            )
        }

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

        const videoView = await prisma.videoView.findUnique({
            where: {
                userId_videoAssetId_enrollmentId: {
                    userId: user.id,
                    videoAssetId,
                    enrollmentId,
                },
            },
            select: {
                id: true,
                watchDurationSeconds: true,
                completionPercentage: true,
                lastPositionSeconds: true,
                completed: true,
                startedAt: true,
                lastWatchedAt: true,
            },
        })

        if (!videoView) {
            return createSuccessResponse({
                progress: null,
                message: 'No watch progress recorded yet',
            })
        }

        return createSuccessResponse({
            progress: {
                id: videoView.id,
                watchDurationSeconds: videoView.watchDurationSeconds,
                completionPercentage: Number(videoView.completionPercentage),
                lastPositionSeconds: videoView.lastPositionSeconds,
                completed: videoView.completed,
                startedAt: videoView.startedAt,
                lastWatchedAt: videoView.lastWatchedAt,
            },
        })
    } catch (error) {
        console.error('[GET /api/video/[videoAssetId]/progress]', error)
        return serverError('Failed to fetch video progress')
    }
}
