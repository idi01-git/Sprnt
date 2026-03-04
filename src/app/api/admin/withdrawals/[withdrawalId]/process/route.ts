import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, conflict, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ withdrawalId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { withdrawalId } = await params

        const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } })
        if (!withdrawal) return notFound('Withdrawal')

        if (withdrawal.status !== 'pending') {
            return conflict('Withdrawal is not in pending state')
        }

        const updated = await prisma.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: { status: 'processing', processedBy: adminId, processedAt: new Date() },
            include: { user: { select: { name: true, email: true } } },
        })

        await logAdminAction(adminId, 'withdrawal_processing_started', 'withdrawal', withdrawalId)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[PATCH /api/admin/withdrawals/[withdrawalId]/process]', error)
        return serverError('Failed to process withdrawal')
    }
}
