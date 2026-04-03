import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import {
    adminCourseListQuerySchema,
    adminCreateCourseSchema,
} from '@/lib/validations/admin'
import { del, delPattern, CACHE_KEYS } from '@/lib/cache'
import type { Prisma } from '@/generated/prisma/client'
import crypto from 'crypto'

// =============================================================================
// Helpers
// =============================================================================

function generateCourseId(): string {
    return `COURSE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

function slugify(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    const suffix = crypto.randomBytes(3).toString('hex')
    return `${base}-${suffix}`
}

type SortKey = 'newest' | 'oldest' | 'name' | 'price_asc' | 'price_desc'

function buildOrderBy(sort: SortKey): Prisma.CourseOrderByWithRelationInput {
    const map: Record<SortKey, Prisma.CourseOrderByWithRelationInput> = {
        newest: { createdAt: 'desc' },
        oldest: { createdAt: 'asc' },
        name: { courseName: 'asc' },
        price_asc: { coursePrice: 'asc' },
        price_desc: { coursePrice: 'desc' },
    }
    return map[sort]
}

// =============================================================================
// GET /api/admin/courses — List all courses (paginated, filterable)
// =============================================================================

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const url = new URL(request.url)
        const query = Object.fromEntries(url.searchParams)
        const parsed = adminCourseListQuerySchema.safeParse(query)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { search, branch, status, page, limit, sort } = parsed.data

        // Build where clause
        const where: Prisma.CourseWhereInput = {}
        if (search) {
            where.OR = [
                { courseName: { contains: search, mode: 'insensitive' } },
                { courseDescription: { contains: search, mode: 'insensitive' } },
                { courseId: { contains: search, mode: 'insensitive' } },
            ]
        }
        if (branch) where.affiliatedBranch = branch
        if (status === 'active') {
            where.isActive = true
            where.deletedAt = null
        } else if (status === 'inactive') {
            where.OR = [{ isActive: false }, { deletedAt: { not: null } }]
        }
        // 'all' → no filter

        const skip = (page - 1) * limit

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy: buildOrderBy(sort as SortKey),
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { modules: true, enrollments: true },
                    },
                },
            }),
            prisma.course.count({ where }),
        ])

const items = courses.map(c => {
            let tags: string[] = []
            try { tags = typeof c.tags === 'string' ? JSON.parse(c.tags) : Array.isArray(c.tags) ? c.tags : [] }
            catch { tags = [] }
            return {
                id: c.id,
                courseId: c.courseId,
                courseName: c.courseName,
                slug: c.slug,
                branch: c.affiliatedBranch,
                price: Number(c.coursePrice),
                isActive: c.isActive,
                tags,
                modulesCount: c._count.modules,
                enrollmentsCount: c._count.enrollments,
                createdAt: c.createdAt.toISOString(),
                deletedAt: c.deletedAt?.toISOString() || null,
            }
        })

        const totalPages = Math.ceil(total / limit)
        const meta = { total, page, pageSize: limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }

        return NextResponse.json({ success: true, data: { courses: items }, meta }, { status: HttpStatus.OK })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/courses]', error)
        return serverError('Failed to fetch courses')
    }
}

// =============================================================================
// POST /api/admin/courses — Create new course
// =============================================================================

export async function POST(request: Request) {
    try {
        await requireAdminOrAbove()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCreateCourseSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        const course = await prisma.course.create({
            data: {
                courseId: generateCourseId(),
                slug: slugify(data.courseName),
                courseName: data.courseName,
                affiliatedBranch: data.affiliatedBranch,
                coursePrice: data.coursePrice,
                courseThumbnail: data.courseThumbnail,
                courseDescription: data.courseDescription,
                problemStatementText: data.problemStatementText,
                tags: data.tags,
                isActive: data.isActive,
            },
        })

        delPattern(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse({
            course: {
                id: course.id,
                courseId: course.courseId,
                courseName: course.courseName,
                slug: course.slug,
                branch: course.affiliatedBranch,
                price: Number(course.coursePrice),
                isActive: course.isActive,
                tags: course.tags,
                modulesCount: 0,
                enrollmentsCount: 0,
                createdAt: course.createdAt.toISOString(),
            },
        }, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/courses]', error)
        return serverError('Failed to create course')
    }
}
