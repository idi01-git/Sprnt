import { NextRequest } from 'next/server'
import { validateAdminRequest, invalidateAdminSession } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/admin/auth/logout
 * Invalidates the current admin session.
 * Auth: Admin Session Cookie
 */
export async function POST(_request: NextRequest) {
    try {
        const { session } = await validateAdminRequest()
        if (!session) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        await invalidateAdminSession(session.id)

        return createSuccessResponse({
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('[POST /api/admin/auth/logout]', error)
        return serverError('Failed to logout')
    }
}
