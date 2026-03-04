import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminWebhookLogsQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminWebhookLogsQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { type, status, dateFrom, dateTo, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.WebhookLogWhereInput = {}

        if (type) where.webhookType = type
        if (status !== 'all') where.status = status

        if (dateFrom || dateTo) {
            where.processedAt = {}
            if (dateFrom) where.processedAt.gte = dateFrom
            if (dateTo) where.processedAt.lte = dateTo
        }

        const [logs, total] = await Promise.all([
            prisma.webhookLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { processedAt: 'desc' },
            }),
            prisma.webhookLog.count({ where }),
        ])

        return createPaginatedResponse(logs, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/webhook-logs]', error)
        return serverError('Failed to fetch webhook logs')
    }
}
