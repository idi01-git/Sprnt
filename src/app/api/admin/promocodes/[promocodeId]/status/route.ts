import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { promocodeId } = await params

        const promocode = await prisma.promocode.findFirst({
            where: { id: promocodeId, deletedAt: null }
        })

        if (!promocode) return notFound('Promocode')

        const newStatus = !promocode.isActive
        const updated = await prisma.promocode.update({
            where: { id: promocodeId },
            data: { isActive: newStatus }
        })

        await logAdminAction(adminId, 'promocode_status_toggled', 'promocode', promocodeId, { isActive: newStatus })

        return createSuccessResponse({ isActive: updated.isActive })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/promocodes/[promocodeId]/status]', error)
        return serverError('Failed to toggle status')
    }
}
