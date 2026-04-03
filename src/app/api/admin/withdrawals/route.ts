import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminWithdrawalListQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminWithdrawalListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { status, page, limit, sort } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.WithdrawalRequestWhereInput = {}
        if (status !== 'all') {
            where.status = status
        }

        const orderBy = sort === 'oldest' ? { requestedAt: 'asc' as const } : { requestedAt: 'desc' as const }

        const [withdrawals, total] = await Promise.all([
            prisma.withdrawalRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    userId: true,
                    amount: true,
                    upiId: true,
                    status: true,
                    adminConfirmed: true,
                    requestedAt: true,
                    processedAt: true,
                    rejectionReason: true,
                    transactionId: true,
                    user: { select: { name: true, email: true } },
                }
            }),
            prisma.withdrawalRequest.count({ where }),
        ])

        const items = withdrawals.map(w => ({
            id: w.id,
            userId: w.userId,
            userName: w.user.name,
            userEmail: w.user.email,
            amount: Number(w.amount),
            status: w.status,
            createdAt: w.requestedAt.toISOString(),
            processedAt: w.processedAt?.toISOString() ?? null,
            upiId: w.upiId,
        }))

        return createPaginatedResponse({ withdrawals: items }, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/withdrawals]', error)
        return serverError()
    }
}
