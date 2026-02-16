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
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications (for badge display).
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

        const count = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        })

        return createSuccessResponse({ unreadCount: count })
    } catch (error) {
        console.error('[GET /api/notifications/unread-count]', error)
        return serverError('Failed to fetch unread count')
    }
}
