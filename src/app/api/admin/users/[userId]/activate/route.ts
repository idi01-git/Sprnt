import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { userId } = await params

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return notFound('User')

        if (!user.deletedAt) {
            return conflict('User is not suspended')
        }

        await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: null },
        })

        await logAdminAction(adminId, 'user_activated', 'user', userId)

        return createSuccessResponse({ message: 'User reactivated' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/users/[userId]/activate]', error)
        return serverError()
    }
}
