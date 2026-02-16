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
 * GET /api/learn/{enrollmentId}/day/{dayNumber}
 * Get day content: module info, video assets, quiz availability, lock status.
 * Auth: Session Cookie (owner only, must be enrolled with success payment)
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ enrollmentId: string; dayNumber: string }> }
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

        const { enrollmentId, dayNumber: dayNumberStr } = await params
        const dayNumber = parseInt(dayNumberStr, 10)

        if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 7) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Day number must be between 1 and 7',
                HttpStatus.BAD_REQUEST
            )
        }

        // Verify enrollment exists, belongs to user, and is active
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                currentDay: true,
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
                'You do not have access to this enrollment',
                HttpStatus.FORBIDDEN
            )
        }

        if (enrollment.paymentStatus !== 'success') {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Payment has not been completed for this enrollment',
                HttpStatus.FORBIDDEN
            )
        }

        // Check day progress (lock status)
        const progress = await prisma.dailyProgress.findUnique({
            where: {
                enrollmentId_dayNumber: {
                    enrollmentId: enrollment.id,
                    dayNumber,
                },
            },
            select: {
                isLocked: true,
                quizPassed: true,
                quizAttempted: true,
                quizAttempts: true,
                quizCooldownUntil: true,
            },
        })

        // Day 1 is always accessible, others must be unlocked
        if (dayNumber > 1 && (!progress || progress.isLocked)) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                `Day ${dayNumber} is locked. Complete the quiz for Day ${dayNumber - 1} first.`,
                HttpStatus.FORBIDDEN
            )
        }

        // Fetch the course module for this day
        const courseModule = await prisma.courseModule.findUnique({
            where: {
                courseId_dayNumber: {
                    courseId: enrollment.courseId,
                    dayNumber,
                },
            },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                contentText: true,
                isFreePreview: true,
                notesPdfUrl: true,
                videoAssets: {
                    where: { uploadStatus: 'completed' },
                    select: {
                        id: true,
                        cdnUrl: true,
                        durationSeconds: true,
                        resolution: true,
                    },
                    take: 1,
                },
            },
        })

        if (!courseModule) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                `Day ${dayNumber} content not found for this course`,
                HttpStatus.NOT_FOUND
            )
        }

        const videoAsset = courseModule.videoAssets[0] ?? null

        // Get video view progress if video exists
        let videoProgress = null
        if (videoAsset) {
            videoProgress = await prisma.videoView.findUnique({
                where: {
                    userId_videoAssetId_enrollmentId: {
                        userId: user.id,
                        videoAssetId: videoAsset.id,
                        enrollmentId: enrollment.id,
                    },
                },
                select: {
                    watchDurationSeconds: true,
                    completionPercentage: true,
                    lastPositionSeconds: true,
                    completed: true,
                },
            })
        }

        // Mark day as started if not already
        if (!progress) {
            await prisma.dailyProgress.create({
                data: {
                    enrollmentId: enrollment.id,
                    dayNumber,
                    isLocked: dayNumber > 1,
                    startedAt: new Date(),
                },
            })
        } else if (!progress.quizAttempted) {
            // Update startedAt if first real access
            await prisma.dailyProgress.update({
                where: {
                    enrollmentId_dayNumber: {
                        enrollmentId: enrollment.id,
                        dayNumber,
                    },
                },
                data: { startedAt: new Date() },
            })
        }

        return createSuccessResponse({
            day: {
                dayNumber: courseModule.dayNumber,
                title: courseModule.title,
                description: courseModule.contentText,
                moduleId: courseModule.id,
                notesPdfUrl: courseModule.notesPdfUrl,
                video: videoAsset
                    ? {
                        id: videoAsset.id,
                        durationSeconds: videoAsset.durationSeconds,
                        resolution: videoAsset.resolution,
                        progress: videoProgress
                            ? {
                                watchDurationSeconds: videoProgress.watchDurationSeconds,
                                completionPercentage: Number(videoProgress.completionPercentage),
                                lastPositionSeconds: videoProgress.lastPositionSeconds,
                                completed: videoProgress.completed,
                            }
                            : null,
                    }
                    : null,
                quiz: {
                    attempted: progress?.quizAttempted ?? false,
                    passed: progress?.quizPassed ?? false,
                    attempts: progress?.quizAttempts ?? 0,
                    cooldownUntil: progress?.quizCooldownUntil ?? null,
                    cooldownActive: progress?.quizCooldownUntil
                        ? new Date() < progress.quizCooldownUntil
                        : false,
                },
                isLocked: progress?.isLocked ?? (dayNumber > 1),
            },
        })
    } catch (error) {
        console.error('[GET /api/learn/[enrollmentId]/day/[dayNumber]]', error)
        return serverError('Failed to fetch day content')
    }
}
