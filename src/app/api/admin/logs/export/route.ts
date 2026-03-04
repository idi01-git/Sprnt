import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, serverError, badRequest, HttpStatus, ErrorCode } from '@/lib/api-response'
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

        const { adminId, action, entityType, dateFrom, dateTo } = parsed.data

        const where: Prisma.AdminLogWhereInput = {}
        if (adminId) where.adminId = adminId
        if (action) where.action = action
        if (entityType) where.entityType = entityType
        if (dateFrom || dateTo) {
            where.timestamp = {}
            if (dateFrom) where.timestamp.gte = dateFrom
            if (dateTo) where.timestamp.lte = dateTo
        }

        // Fetch ALL matching logs
        const logs = await prisma.adminLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
        })

        // Get all admin IDs to fetch their usernames
        const adminIds = [...new Set(logs.map(l => l.adminId))]
        const admins = await prisma.admin.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, username: true }
        })
        const adminMap = new Map(admins.map(a => [a.id, a.username]))

        const header = 'id,adminId,adminUsername,action,entityType,entityId,ipAddress,timestamp\n'
        const rows = logs.map(l => {
            const safeIp = l.ipAddress ?? ''
            const safeEntityId = l.entityId ?? ''
            const username = adminMap.get(l.adminId) ?? 'Unknown'
            return `${l.id},${l.adminId},${username},${l.action},${l.entityType},${safeEntityId},${safeIp},${l.timestamp.toISOString()}`
        }).join('\n')

        const csv = header + rows

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=admin-logs-${new Date().toISOString().slice(0, 10)}.csv`,
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
        console.error('[GET /api/admin/logs/export]', error)
        return serverError('Failed to export logs')
    }
}
