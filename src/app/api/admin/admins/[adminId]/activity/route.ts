import { prisma } from '@/lib/db'
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminActivityQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ adminId: string }> }
) {
    try {
        await requireSuperAdmin()
        const { adminId } = await params

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminActivityQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { from, to, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.AdminLogWhereInput = { adminId }

        if (from || to) {
            where.timestamp = {}
            if (from) where.timestamp.gte = from
            if (to) where.timestamp.lte = to
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

        return createPaginatedResponse(logs, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/admins/[adminId]/activity]', error)
        return serverError()
    }
}
