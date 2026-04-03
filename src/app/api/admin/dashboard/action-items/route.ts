import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/admin/dashboard/action-items
 * Returns counts of pending administrative tasks.
 * Auth: Admin (any role)
 */
export async function GET(_request: NextRequest) {
    try {
        await requireAdmin()

        const [pendingSubmissions, pendingWithdrawals] = await Promise.all([
            prisma.submission.count({ where: { reviewStatus: 'pending' } }),
            prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
        ])

        const totalPending = pendingSubmissions + pendingWithdrawals

        return createSuccessResponse({
            actionItems: {
                pendingSubmissions,
                pendingWithdrawals,
                pendingIdentityVerifications: 0,
                totalPending,
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/dashboard/action-items]', error)
        return serverError('Failed to fetch action items')
    }
}
