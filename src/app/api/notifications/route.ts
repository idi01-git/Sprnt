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
import { notificationQuerySchema } from '@/lib/validations/notification'


/**
 * GET /api/notifications
 * Returns a paginated list of notifications for the authenticated user.
 * Query params: page, pageSize, unreadOnly
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

        const { searchParams } = new URL(request.url)
        const parsed = notificationQuerySchema.safeParse({
            page: searchParams.get('page') ?? undefined,
            pageSize: searchParams.get('pageSize') ?? undefined,
            unreadOnly: searchParams.get('unreadOnly') ?? undefined,
        })

        if (!parsed.success) {
            return badRequest('Invalid query parameters', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { page, pageSize, unreadOnly } = parsed.data
        const skip = (page - 1) * pageSize

        const where: Record<string, unknown> = { userId: user.id }
        if (unreadOnly) {
            where.isRead = false
        }

        const [total, notifications] = await Promise.all([
            prisma.notification.count({ where }),
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    isRead: true,
                    readAt: true,
                    createdAt: true,
                },
            }),
        ])

        return createPaginatedResponse(notifications, { total, page, pageSize })
    } catch (error) {
        console.error('[GET /api/notifications]', error)
        return serverError('Failed to fetch notifications')
    }
}
