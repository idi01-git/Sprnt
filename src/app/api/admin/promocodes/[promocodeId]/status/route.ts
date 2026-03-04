import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminPromocodeStatusSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { promocodeId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminPromocodeStatusSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const promocode = await prisma.promocode.findFirst({
            where: { id: promocodeId, deletedAt: null }
        })

        if (!promocode) return notFound('Promocode')

        const updated = await prisma.promocode.update({
            where: { id: promocodeId },
            data: { isActive: parsed.data.isActive }
        })

        await logAdminAction(adminId, 'promocode_status_changed', 'promocode', promocodeId, { isActive: parsed.data.isActive })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/promocodes/[promocodeId]/status]', error)
        return serverError()
    }
}
