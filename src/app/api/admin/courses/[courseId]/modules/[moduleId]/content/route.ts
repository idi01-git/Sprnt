import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminUpdateContentSchema } from '@/lib/validations/admin'

// =============================================================================
// PUT /api/admin/courses/[courseId]/modules/[moduleId]/content — Update text
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        // Verify module belongs to course
        const module = await prisma.courseModule.findFirst({
            where: { id: moduleId, course: { courseId } },
        })
        if (!module) return notFound('Module')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateContentSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const updated = await prisma.courseModule.update({
            where: { id: moduleId },
            data: {
                contentText: parsed.data.contentText,
            },
        })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[PUT /api/admin/courses/[courseId]/modules/[moduleId]/content]',
            error,
        )
        return serverError()
    }
}
