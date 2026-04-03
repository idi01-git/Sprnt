import crypto from 'crypto'
import { hash } from 'argon2'
import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus, createErrorResponse, ErrorCode } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { userId } = await params

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return notFound('User')

        const token = crypto.randomBytes(32).toString('hex')
        const tokenHash = await hash(token)

        await prisma.user.update({
            where: { id: userId },
            data: { hashedPassword: tokenHash },
        })

        console.info(`[admin/reset-password] Password reset for user ${userId}`)
        await logAdminAction(adminId, 'user_password_reset', 'user', userId)

        return createSuccessResponse({ message: 'Password has been reset' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/users/[userId]/reset-password]', error)
        return serverError()
    }
}
