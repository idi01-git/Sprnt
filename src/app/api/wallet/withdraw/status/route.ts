import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/wallet/withdraw/status
 * Returns the latest withdrawal request status for the authenticated user.
 * Auth: Student Session Cookie
 */
export async function GET(_request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Get the most recent withdrawal request
        const latestWithdrawal = await prisma.withdrawalRequest.findFirst({
            where: { userId: user.id },
            orderBy: { requestedAt: 'desc' },
            select: {
                id: true,
                amount: true,
                upiId: true,
                status: true,
                adminConfirmed: true,
                transactionId: true,
                rejectionReason: true,
                requestedAt: true,
                processedAt: true,
            },
        })

        if (!latestWithdrawal) {
            return createSuccessResponse({
                withdrawal: null,
                message: 'No withdrawal requests found',
            })
        }

        return createSuccessResponse({
            withdrawal: {
                ...latestWithdrawal,
                amount: Number(latestWithdrawal.amount),
            },
        })
    } catch (error) {
        console.error('[GET /api/wallet/withdraw/status]', error)
        return serverError('Failed to fetch withdrawal status')
    }
}
