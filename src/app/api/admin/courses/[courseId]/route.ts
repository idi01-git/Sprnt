import { prisma } from '@/lib/db'
import { requireAdminOrAbove, requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminUpdateCourseSchema } from '@/lib/validations/admin'
import { del, delPattern, CACHE_KEYS } from '@/lib/cache'

// =============================================================================
// Helpers
// =============================================================================

async function findCourseByBusinessId(courseId: string) {
    return prisma.course.findUnique({ where: { courseId } })
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

// =============================================================================
// GET /api/admin/courses/{courseId} — Full course detail
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        console.log(`[GET /api/admin/courses/${courseId}] Fetching course detail`)

        const course = await prisma.course.findUnique({
            where: { courseId },
            include: {
                modules: {
                    orderBy: { dayNumber: 'asc' },
                    select: {
                        id: true,
                        courseId: true,
                        dayNumber: true,
                        title: true,
                        contentText: true,
                        youtubeUrl: true,
                        notesPdfUrl: true,
                        isFreePreview: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        })

        if (!course) {
            console.log(`[GET /api/admin/courses/${courseId}] Course not found in DB`)
            return notFound('Course')
        }

        console.log(`[GET /api/admin/courses/${courseId}] Found course:`, course.courseName)

        // Separate count query for enrollments to properly filter deletedAt
        const enrollmentCount = await prisma.enrollment.count({
            where: { courseId: course.id, deletedAt: null },
        })

        // Map Prisma fields to API response format with serialized dates
        const mappedCourse = {
            id: course.id,
            courseId: course.courseId,
            courseName: course.courseName,
            slug: course.slug,
            branch: course.affiliatedBranch,
            price: Number(course.coursePrice),
            courseDescription: course.courseDescription || '',
            courseThumbnail: course.courseThumbnail || '',
            problemStatementText: course.problemStatementText || '',
            isActive: course.isActive,
            tags: course.tags || [],
            createdAt: course.createdAt.toISOString(),
            updatedAt: course.updatedAt.toISOString(),
            modules: (course.modules || []).map(m => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })),
            _count: {
                enrollments: enrollmentCount,
                modules: course._count?.modules || 0,
            },
        }

        return createSuccessResponse({ course: mappedCourse })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]]', error, { courseId })
        return serverError()
    }
}

// =============================================================================
// PUT /api/admin/courses/{courseId} — Update course fields
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const existing = await findCourseByBusinessId(courseId)
        if (!existing) return notFound('Course')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateCourseSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        // Re-slug if name changes
        const updateData: Record<string, unknown> = { ...data }
        if (data.courseName && data.courseName !== existing.courseName) {
            updateData.slug = slugify(data.courseName)
        }

        const updated = await prisma.course.update({
where: { courseId },
            data: updateData,
        })

        delPattern(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/courses/[courseId]]', error)
        return serverError()
    }
}

// =============================================================================
// DELETE /api/admin/courses/{courseId} — Soft delete (Super Admin only)
// =============================================================================

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireSuperAdmin()
        const { courseId } = await params

        const existing = await findCourseByBusinessId(courseId)
        if (!existing) return notFound('Course')

        if (existing.deletedAt) {
            return conflict('Course is already deleted')
        }

        const deleted = await prisma.course.update({
            where: { courseId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        })

        // Delete all course list caches (keys have suffixes for branch/search/sort/page/limit)
        delPattern(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse({ message: 'Course soft-deleted', course: deleted })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[DELETE /api/admin/courses/[courseId]]', error)
        return serverError()
    }
}

// =============================================================================
// PATCH /api/admin/courses/{courseId} — Restore deleted course
// =============================================================================

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireSuperAdmin()
        const { courseId } = await params
        const url = new URL(request.url)
        const action = url.searchParams.get('action')

        // Handle restore action
        if (action === 'restore') {
            const course = await findCourseByBusinessId(courseId)
            if (!course) return notFound('Course')

            if (!course.deletedAt) {
                return conflict('Course is not deleted')
            }

            const restored = await prisma.course.update({
                where: { courseId },
                data: {
                    deletedAt: null,
                    isActive: true,
                },
            })

            // Delete all course list caches (keys have suffixes for branch/search/sort/page/limit)
            delPattern(CACHE_KEYS.COURSES_LIST)
            del(CACHE_KEYS.COURSES_BRANCHES)

            return createSuccessResponse({ course: restored, message: 'Course restored successfully' })
        }

        return badRequest('Invalid action. Use ?action=restore')
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/courses/[courseId]]', error)
        return serverError()
    }
}
