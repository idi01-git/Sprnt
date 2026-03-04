import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminLogsQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminLogsQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { adminId, action, entityType, dateFrom, dateTo, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.AdminLogWhereInput = {}

        if (adminId) where.adminId = adminId
        if (action) where.action = action
        if (entityType) where.entityType = entityType

        if (dateFrom || dateTo) {
            where.timestamp = {}
            if (dateFrom) where.timestamp.gte = dateFrom
            if (dateTo) where.timestamp.lte = dateTo
        }

        const [logs, total] = await Promise.all([
            prisma.adminLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
            }),
            prisma.adminLog.count({ where }),
        ])

        // Get admin info for all logs
        const adminIds = [...new Set(logs.map(l => l.adminId))]
        const admins = await prisma.admin.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, username: true, email: true }
        })
        const adminMap = new Map(admins.map(a => [a.id, { username: a.username, email: a.email }]))

        const logsWithAdmin = logs.map(l => ({
            ...l,
            admin: adminMap.get(l.adminId) ?? null,
        }))

        return createPaginatedResponse(logsWithAdmin, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/logs]', error)
        return serverError('Failed to fetch logs')
    }
}
