import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [pendingCount, pendingAmount, processedToday, processedAmountToday, totalProcessed] = await Promise.all([
            prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
            prisma.withdrawalRequest.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
            prisma.withdrawalRequest.count({ where: { status: 'completed', processedAt: { gte: today } } }),
            prisma.withdrawalRequest.aggregate({ where: { status: 'completed', processedAt: { gte: today } }, _sum: { amount: true } }),
            prisma.withdrawalRequest.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
        ])

        return createSuccessResponse({
            stats: {
                pendingCount,
                pendingAmount: Number(pendingAmount._sum.amount ?? 0),
                processedToday,
                processedAmountToday: Number(processedAmountToday._sum.amount ?? 0),
                totalProcessed: Number(totalProcessed._sum.amount ?? 0),
            }
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/withdrawals/stats]', error)
        return serverError()
    }
}
