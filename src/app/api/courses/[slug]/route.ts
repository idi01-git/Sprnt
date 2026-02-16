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
 * GET /api/courses/{slug}
 * Get full course details: name, description, branch, price, thumbnail, tags,
 * problem statement text, module count.
 * Public endpoint — no auth required.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        if (!slug) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Course slug is required',
                HttpStatus.BAD_REQUEST
            )
        }

        // findFirst instead of findUnique — isActive/deletedAt are not unique fields
        const course = await prisma.course.findFirst({
            where: {
                slug,
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                courseId: true,
                courseName: true,
                slug: true,
                affiliatedBranch: true,
                coursePrice: true,
                courseThumbnail: true,
                courseDescription: true,
                courseTranscriptUrl: true,
                problemStatementText: true,
                problemStatementPdfUrl: true,
                tags: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { modules: true, enrollments: true } },
            },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                `Course '${slug}' not found`,
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({ course })
    } catch (error) {
        console.error('[GET /api/courses/[slug]]', error)
        return serverError('Failed to fetch course details')
    }
}
