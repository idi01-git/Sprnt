import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        const { adminId: currentAdminId } = await requireSuperAdmin()
        const { adminId } = await params

        const admin = await prisma.admin.findUnique({ where: { id: adminId } })
        if (!admin) return notFound('Admin')

        if (admin.isActive) {
            return conflict('Admin account is already active')
        }

        await prisma.admin.update({
            where: { id: adminId },
            data: { isActive: true }
        })

        await logAdminAction(currentAdminId, 'admin_account_reactivated', 'admin', adminId)

        return createSuccessResponse({ message: 'Admin account reactivated' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/admins/[adminId]/activate]', error)
        return serverError()
    }
}
