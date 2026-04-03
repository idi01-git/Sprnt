import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, conflict, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
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

        // Note: Balance was already deducted when user created the withdrawal request
        // So we only need to mark it as completed here
        await prisma.$transaction([
            prisma.withdrawalRequest.update({
                where: { id: withdrawalId },
                data: { status: 'completed', adminConfirmed: true, transactionId: parsed.data.transactionId, processedAt: new Date() },
            }),
            prisma.transaction.create({
                data: {
                    userId: withdrawal.userId,
                    transactionType: 'withdrawal',
                    amount: Number(withdrawal.amount) * -1, // Negative for debit
                    status: 'completed',
                    withdrawalRequestId: withdrawalId,
                    adminId,
                },
            }),
        ])

        await logAdminAction(adminId, 'withdrawal_completed', 'withdrawal', withdrawalId, { transactionId: parsed.data.transactionId })

        return createSuccessResponse({ message: 'Withdrawal completed successfully' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/withdrawals/[withdrawalId]/complete]', error)
        return serverError()
    }
}
