import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, conflict, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminRejectWithdrawalSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ withdrawalId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { withdrawalId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminRejectWithdrawalSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } })
        if (!withdrawal) return notFound('Withdrawal')

        if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
            return conflict('Can only reject pending or processing withdrawals')
        }

        await prisma.$transaction([
            prisma.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: {
                    status: 'rejected',
                    rejectionReason: parsed.data.reason,
                    processedBy: adminId,
                    processedAt: new Date(),
                },
            }),
            // Refund the balance back to user wallet (balance was deducted when request was created)
            prisma.user.update({
                where: { id: withdrawal.userId },
                data: { walletBalance: { increment: withdrawal.amount } },
            }),
            prisma.transaction.create({
                data: {
                    userId: withdrawal.userId,
                    transactionType: 'withdrawal',
                    amount: Number(withdrawal.amount), // Positive for refund
                    status: 'completed',
                    withdrawalRequestId: withdrawalId,
                    reason: `Rejected: ${parsed.data.reason}`,
                },
            }),
        ])

        await logAdminAction(adminId, 'withdrawal_rejected', 'withdrawal', withdrawalId, { reason: parsed.data.reason })

        return createSuccessResponse({ message: 'Withdrawal rejected successfully' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/withdrawals/[withdrawalId]/reject]', error)
        return serverError('Failed to reject withdrawal')
    }
}
