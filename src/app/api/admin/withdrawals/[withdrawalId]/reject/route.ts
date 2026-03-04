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
            prisma.notification.create({
                data: {
                    userId: withdrawal.userId,
                    type: 'withdrawal_rejected',
                    title: 'Withdrawal Rejected',
                    message: `Your withdrawal request was rejected. Reason: ${parsed.data.reason}`,
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
