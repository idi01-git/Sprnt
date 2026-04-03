import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { createSuccessResponse, createErrorResponse, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

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

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
        const skip = (page - 1) * limit

        const [withdrawals, total] = await Promise.all([
            prisma.withdrawalRequest.findMany({
                where: { userId: user.id },
                orderBy: { requestedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.withdrawalRequest.count({ where: { userId: user.id } }),
        ])

        const items = withdrawals.map(w => ({
            id: w.id,
            amount: Number(w.amount),
            upiId: w.upiId,
            status: w.status,
            rejectionReason: w.rejectionReason || null,
            transactionId: w.transactionId || null,
            requestedAt: w.requestedAt.toISOString(),
            processedAt: w.processedAt?.toISOString() || null,
        }))

        const totalPages = Math.ceil(total / limit)

        return createSuccessResponse({
            withdrawals: items,
            total,
            page,
            pageSize: limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        })
    } catch (error) {
        console.error('[GET /api/wallet/withdrawals]', error)
        return serverError('Failed to fetch withdrawal requests')
    }
}