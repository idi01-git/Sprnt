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
 * GET /api/courses/{slug}/modules/day-1/preview
 * Get Day 1 full content: video CDN URL (unsigned, preview quality),
 * content text, notes PDF link. Free for all visitors.
 * Public endpoint — no auth required.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // findFirst — slug is unique but we also filter by isActive/deletedAt
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

        // Get Day 1 module with its assets
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
                isFreePreview: true,
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

        if (!day1Module) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Day 1 module not found for this course',
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({
            module: {
                id: day1Module.id,
                dayNumber: day1Module.dayNumber,
                title: day1Module.title,
                contentText: day1Module.contentText,
                notesPdfUrl: day1Module.notesPdfUrl,
                isFreePreview: day1Module.isFreePreview,
                video: day1Module.videoAssets[0] ?? null,
            },
        })
    } catch (error) {
        console.error('[GET /api/courses/[slug]/modules/day-1/preview]', error)
        return serverError('Failed to fetch day 1 preview')
    }
}
