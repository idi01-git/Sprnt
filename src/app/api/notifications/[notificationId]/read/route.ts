import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    notFound,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * PATCH /api/notifications/{notificationId}/read
 * Marks a single notification as read.
 * Auth: Student Session Cookie
 */
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { notificationId } = await params

        // Find notification and verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { id: true, userId: true, isRead: true },
        })

        if (!notification) {
            return notFound('Notification')
        }

        if (notification.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.NOTIFICATION_ACCESS_DENIED,
                'You do not have access to this notification',
                HttpStatus.FORBIDDEN
            )
        }

        // Already read — idempotent success
        if (notification.isRead) {
            return createSuccessResponse({
                notification: { id: notificationId, isRead: true },
                message: 'Notification already marked as read',
            })
        }

        // Mark as read
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        })

        return createSuccessResponse({
            notification: { id: notificationId, isRead: true },
        })
    } catch (error) {
        console.error('[PATCH /api/notifications/:id/read]', error)
        return serverError('Failed to mark notification as read')
    }
}
