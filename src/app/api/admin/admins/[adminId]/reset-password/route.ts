import crypto from 'crypto'
import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        const { adminId: currentAdminId } = await requireSuperAdmin()
        const { adminId } = await params

        const admin = await prisma.admin.findUnique({ where: { id: adminId } })
        if (!admin) return notFound('Admin')

        const tempPassword = crypto.randomBytes(16).toString('hex')
        const passwordHash = await hash(tempPassword)

        await prisma.admin.update({
            where: { id: adminId },
            data: { passwordHash }
        })

        console.info(`[admin/reset-password] New password generated for admin ${adminId}. Send via secure channel. Temp password: ${tempPassword}`)

        await logAdminAction(currentAdminId, 'admin_password_reset', 'admin', adminId)

        return createSuccessResponse({ message: 'Password has been reset. Notification sent.' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/admins/[adminId]/reset-password]', error)
        return serverError()
    }
}
