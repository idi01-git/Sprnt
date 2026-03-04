import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { adminCompleteWithdrawalSchema } from '@/lib/validations/admin'
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

        const parsed = adminCompleteWithdrawalSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } })
        if (!withdrawal) return notFound('Withdrawal')

        if (withdrawal.status !== 'processing') {
            return conflict('Can only complete withdrawals in processing state')
        }

        await prisma.$transaction([
            prisma.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: { status: 'completed', adminConfirmed: true, transactionId: parsed.data.transactionId },
            }),
            prisma.user.update({
                where: { id: withdrawal.userId },
                data: { walletBalance: { decrement: withdrawal.amount } },
            }),
            prisma.transaction.create({
                data: {
                    userId: withdrawal.userId,
                    transactionType: 'withdrawal',
                    amount: Number(`-${withdrawal.amount}`),
                    status: 'completed',
                    withdrawalRequestId: withdrawalId,
                    adminId,
                },
            }),
            prisma.notification.create({
                data: {
                    userId: withdrawal.userId,
                    type: 'withdrawal_completed',
                    title: 'Withdrawal Completed ✅',
                    message: `Your withdrawal of ₹${withdrawal.amount} has been processed. Transaction ID: ${parsed.data.transactionId}`,
                },
            }),
        ])

        await logAdminAction(adminId, 'withdrawal_completed', 'withdrawal', withdrawalId, { transactionId: parsed.data.transactionId })

        return createSuccessResponse({ message: 'Withdrawal completed successfully' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/withdrawals/[withdrawalId]/complete]', error)
        return serverError()
    }
}
