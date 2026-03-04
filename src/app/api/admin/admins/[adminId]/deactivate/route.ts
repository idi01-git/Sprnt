import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, forbidden, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        const { adminId: currentAdminId } = await requireSuperAdmin()
        const { adminId } = await params

        if (currentAdminId === adminId) {
            return forbidden('Cannot deactivate yourself')
        }

        const admin = await prisma.admin.findUnique({ where: { id: adminId } })
        if (!admin) return notFound('Admin')

        await prisma.$transaction([
            prisma.admin.update({
                where: { id: adminId },
                data: { isActive: false }
            }),
            prisma.adminSession.deleteMany({
                where: { adminId }
            }),
        ])

        await logAdminAction(currentAdminId, 'admin_account_deactivated', 'admin', adminId)

        return createSuccessResponse({ message: 'Admin account deactivated and sessions revoked' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/admins/[adminId]/deactivate]', error)
        return serverError()
    }
}
