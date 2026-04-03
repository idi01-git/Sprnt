import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { courseSearchQuerySchema } from '@/lib/validations/course'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/courses/search
 * Full-text search across course name and description.
 * Query: ?q=heat+exchanger&limit=10
 * Public endpoint — no auth required.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryObj = Object.fromEntries(searchParams.entries())

        const result = courseSearchQuerySchema.safeParse(queryObj)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Search query is required',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { q, limit } = result.data

        const courses = await prisma.course.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                OR: [
                    { courseName: { contains: q, mode: 'insensitive' } },
                    { courseDescription: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                courseId: true,
                courseName: true,
                slug: true,
                affiliatedBranch: true,
                coursePrice: true,
                courseThumbnail: true,
                tags: true,
            },
            take: limit,
            orderBy: { courseName: 'asc' },
        })

        // Convert Decimal fields to numbers for JSON serialization
        const coursesWithNumbers = courses.map(course => ({
            ...course,
            coursePrice: Number(course.coursePrice),
        }))

        return createSuccessResponse({
            courses: coursesWithNumbers,
            query: q,
            total: coursesWithNumbers.length,
        })
    } catch (error) {
        console.error('[GET /api/courses/search]', error)
        return serverError('Failed to search courses')
    }
}
