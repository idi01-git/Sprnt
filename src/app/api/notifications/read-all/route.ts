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
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read for the authenticated user.
 * Auth: Student Session Cookie
 */
export async function PATCH(_request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        return createSuccessResponse({
            markedAsRead: result.count,
            message: `${result.count} notification(s) marked as read`,
        })
    } catch (error) {
        console.error('[PATCH /api/notifications/read-all]', error)
        return serverError('Failed to mark all notifications as read')
    }
}
