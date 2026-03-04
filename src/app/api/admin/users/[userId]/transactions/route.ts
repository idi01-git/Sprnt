import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminUserSubListQuerySchema } from '@/lib/validations/admin'
import type { Prisma, TransactionType } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { userId } = await params

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminUserSubListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { page, limit, type } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.TransactionWhereInput = { userId }

        if (type) {
            where.transactionType = type as TransactionType
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.transaction.count({ where }),
        ])

        // Convert Decimal amounts to numbers
        const transformed = transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
        }))

        return createPaginatedResponse(transformed, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/users/[userId]/transactions]', error)
        return serverError('Failed to fetch transactions')
    }
}
