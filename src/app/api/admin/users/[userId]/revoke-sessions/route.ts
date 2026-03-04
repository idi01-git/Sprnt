import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
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

        const result = await prisma.session.deleteMany({
            where: { userId },
        })

        await logAdminAction(adminId, 'user_sessions_revoked', 'user', userId)

        return createSuccessResponse({ message: 'All sessions revoked', count: result.count })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/users/[userId]/revoke-sessions]', error)
        return serverError()
    }
}
