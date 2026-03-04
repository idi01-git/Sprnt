import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminCourseStatusSchema } from '@/lib/validations/admin'
import { del, CACHE_KEYS } from '@/lib/cache'

// =============================================================================
// PATCH /api/admin/courses/{courseId}/status — Toggle is_active
// =============================================================================

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        if (course.deletedAt) {
            return conflict('Cannot toggle status of a deleted course')
        }

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCourseStatusSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const updated = await prisma.course.update({
            where: { courseId },
            data: { isActive: parsed.data.isActive },
        })

        del(CACHE_KEYS.COURSES_LIST)
        del(CACHE_KEYS.COURSES_BRANCHES)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/courses/[courseId]/status]', error)
        return serverError()
    }
}
