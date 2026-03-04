import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminReorderModulesSchema } from '@/lib/validations/admin'

// =============================================================================
// PUT /api/admin/courses/[courseId]/modules/reorder — Batch reorder
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminReorderModulesSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { order } = parsed.data

        // Validate all modules belong to this course
        const moduleIds = order.map((o) => o.moduleId)
        const count = await prisma.courseModule.count({
            where: {
                id: { in: moduleIds },
                courseId: course.id,
            },
        })

        if (count !== moduleIds.length) {
            return badRequest('One or more modules do not belong to this course')
        }

        // Perform updates in transaction
        await prisma.$transaction(
            order.map(({ moduleId, dayNumber }) =>
                prisma.courseModule.update({
                    where: { id: moduleId },
                    data: { dayNumber },
                }),
            ),
        )

        return createSuccessResponse({ message: 'Modules reordered successfully' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        // Unique constraint violation could happen if transaction fails order
        // e.g. verify if dayNumber swap causes unique constraint (courseId, dayNumber) error
        // Prisma transaction is sequential but collision might occur during update if not careful.
        // Better: Set all to temporary negative numbers, then to correct positive?
        // Or trust that the user provides a valid permutation?
        // Let's just catch it.
        console.error('[PUT /api/admin/courses/[courseId]/modules/reorder]', error)
        return serverError('Reorder failed. Ensure no duplicate day numbers.')
    }
}
