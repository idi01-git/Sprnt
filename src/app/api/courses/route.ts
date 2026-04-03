import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { courseListQuerySchema } from '@/lib/validations/course'
import {
    createPaginatedResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { get, set, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import type { Prisma } from '@/generated/prisma/client'

/**
 * GET /api/courses
 * List all active courses with filters: branch, search, sort, pagination.
 * Public endpoint — no auth required.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryObj = Object.fromEntries(searchParams.entries())

        const result = courseListQuerySchema.safeParse(queryObj)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid query parameters',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { branch, search, sort, page, limit } = result.data
        const skip = (page - 1) * limit

        // Build cache key based on query params
        const cacheKey = `${CACHE_KEYS.COURSES_LIST}:${branch || 'all'}:${search || 'none'}:${sort}:${page}:${limit}`
        
        // Try to get from cache (only for non-search queries)
        const cached = !search ? get<{ courses: unknown[]; total: number }>(cacheKey) : null
        if (cached) {
            return createPaginatedResponse(
                { courses: cached.courses },
                { total: cached.total, page, pageSize: limit }
            )
        }

        // Build where clause — only active, non-deleted courses
        const where: Prisma.CourseWhereInput = {
            isActive: true,
            deletedAt: null,
        }

        if (branch) {
            where.affiliatedBranch = branch
        }

        if (search) {
            where.OR = [
                { courseName: { contains: search, mode: 'insensitive' } },
                { courseDescription: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Build orderBy
        let orderBy: Prisma.CourseOrderByWithRelationInput
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' }
                break
            case 'price_asc':
                orderBy = { coursePrice: 'asc' }
                break
            case 'price_desc':
                orderBy = { coursePrice: 'desc' }
                break
            case 'name':
                orderBy = { courseName: 'asc' }
                break
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' }
                break
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                select: {
                    id: true,
                    courseId: true,
                    courseName: true,
                    slug: true,
                    affiliatedBranch: true,
                    coursePrice: true,
                    courseThumbnail: true,
                    courseDescription: true,
                    tags: true,
                    createdAt: true,
                    _count: { select: { modules: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.course.count({ where }),
        ])

        // Convert Decimal fields to numbers for JSON serialization
        const coursesWithNumbers = courses.map(course => ({
            ...course,
            coursePrice: Number(course.coursePrice),
        }))

        // Cache the result (only for non-search queries)
        if (!search) {
            set(cacheKey, { courses: coursesWithNumbers, total }, CACHE_TTL.MEDIUM)
        }

        return createPaginatedResponse(
            { courses: coursesWithNumbers },
            { total, page, pageSize: limit }
        )
    } catch (error) {
        console.error('[GET /api/courses]', error)
        return serverError('Failed to fetch courses')
    }
}
