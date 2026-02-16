import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createPaginatedResponse,
    createErrorResponse,
    serverError,
    badRequest,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { transactionQuerySchema } from '@/lib/validations/wallet'

/**
 * GET /api/wallet/transactions
 * Returns paginated transaction history for the authenticated user.
 * Query params: page, pageSize, type (optional filter)
 * Auth: Student Session Cookie
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Parse and validate query params
        const { searchParams } = new URL(request.url)
        const parsed = transactionQuerySchema.safeParse({
            page: searchParams.get('page') ?? undefined,
            pageSize: searchParams.get('pageSize') ?? undefined,
            type: searchParams.get('type') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { page, pageSize, type } = parsed.data
        const skip = (page - 1) * pageSize

        // Build where clause
        const where: Record<string, unknown> = { userId: user.id }
        if (type) {
            where.transactionType = type
        }

        // Parallel: get total + page of data
        const [total, transactions] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    transactionType: true,
                    amount: true,
                    status: true,
                    paymentMethod: true,
                    reason: true,
                    gatewayTransactionId: true,
                    createdAt: true,
                },
            }),
        ])

        // Serialize Decimal → number
        const serialized = transactions.map((tx) => ({
            ...tx,
            amount: Number(tx.amount),
        }))

        return createPaginatedResponse(serialized, { total, page, pageSize })
    } catch (error) {
        console.error('[GET /api/wallet/transactions]', error)
        return serverError('Failed to fetch transactions')
    }
}
