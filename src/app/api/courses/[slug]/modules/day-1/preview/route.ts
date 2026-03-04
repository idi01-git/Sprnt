import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { generatePresignedDownloadUrl, Bucket, Expiry } from '@/lib/r2'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const course = await prisma.course.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            select: { id: true },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                `Course '${slug}' not found`,
                HttpStatus.NOT_FOUND
            )
        }

        const day1Module = await prisma.courseModule.findUnique({
            where: {
                courseId_dayNumber: {
                    courseId: course.id,
                    dayNumber: 1,
                },
            },
            select: {
                id: true,
                dayNumber: true,
                title: true,
                contentText: true,
                notesPdfUrl: true,
                notesR2Key: true,
                isFreePreview: true,
                videoAssets: {
                    where: { uploadStatus: 'completed' },
                    select: {
                        id: true,
                        durationSeconds: true,
                        resolution: true,
                    },
                    take: 1,
                },
            },
        })

        if (!day1Module) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Day 1 module not found for this course',
                HttpStatus.NOT_FOUND
            )
        }

        let notesUrl: string | null = null
        let notesExpiresAt: Date | null = null
        let hasNotes = false

        if (day1Module.notesR2Key) {
            hasNotes = true
            const signedUrl = await generatePresignedDownloadUrl(
                Bucket.PRIVATE,
                day1Module.notesR2Key,
                Expiry.DOWNLOAD
            )
            notesUrl = signedUrl.url
            notesExpiresAt = signedUrl.expiresAt
        } else if (day1Module.notesPdfUrl) {
            hasNotes = true
            notesUrl = day1Module.notesPdfUrl
        }

        return createSuccessResponse({
            module: {
                id: day1Module.id,
                dayNumber: day1Module.dayNumber,
                title: day1Module.title,
                contentText: day1Module.contentText,
                isFreePreview: day1Module.isFreePreview,
                video: day1Module.videoAssets[0] ?? null,
                notes: hasNotes
                    ? {
                          url: notesUrl,
                          expiresAt: notesExpiresAt,
                          isSecure: !!day1Module.notesR2Key,
                      }
                    : null,
            },
        })
    } catch (error) {
        console.error('[GET /api/courses/[slug]/modules/day-1/preview]', error)
        return serverError('Failed to fetch day 1 preview')
    }
}
