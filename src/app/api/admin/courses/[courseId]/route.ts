import { prisma } from '@/lib/db'
import { requireAdminOrAbove, requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminUpdateCourseSchema } from '@/lib/validations/admin'
import { del, CACHE_KEYS } from '@/lib/cache'

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

        const course = await prisma.course.findUnique({
            where: { courseId },
            include: {
                modules: {
                    orderBy: { dayNumber: 'asc' },
                    select: {
                        id: true,
                        dayNumber: true,
                        title: true,
                        isFreePreview: true,
                    },
                },
                _count: {
                    select: { enrollments: true, certificates: true, modules: true },
                },
            },
        })

        if (!course) return notFound('Course')

        return createSuccessResponse(course)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]]', error)
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

        del(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
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

        del(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse({ message: 'Course soft-deleted', course: deleted })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[DELETE /api/admin/courses/[courseId]]', error)
        return serverError()
    }
}
