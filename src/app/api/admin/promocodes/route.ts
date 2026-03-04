import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, conflict, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminPromocodeListQuerySchema, adminCreatePromocodeSchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminPromocodeListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { search, status, page, limit } = parsed.data
        const skip = (page - 1) * limit
        const now = new Date()

        const where: Prisma.PromocodeWhereInput = {}

        if (status === 'active') {
            where.isActive = true
            where.deletedAt = null
            where.validUntil = { gte: now }
            where.validFrom = { lte: now }
        } else if (status === 'inactive') {
            where.isActive = false
            where.deletedAt = null
        } else if (status === 'expired') {
            where.validUntil = { lt: now }
            where.deletedAt = null
        } else if (status === 'all') {
            where.deletedAt = null
        }

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [promocodes, total] = await Promise.all([
            prisma.promocode.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { usages: true } },
                    creator: { select: { username: true } },
                }
            }),
            prisma.promocode.count({ where }),
        ])

        return createPaginatedResponse(promocodes, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/promocodes]', error)
        return serverError()
    }
}

export async function POST(request: Request) {
    try {
        const { adminId } = await requireAdminOrAbove()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminCreatePromocodeSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const existing = await prisma.promocode.findUnique({
            where: { code: parsed.data.code }
        })

        if (existing) {
            return conflict('Promocode code already exists')
        }

        const promocode = await prisma.promocode.create({
            data: {
                ...parsed.data,
                createdBy: adminId,
            }
        })

        await logAdminAction(adminId, 'promocode_created', 'promocode', promocode.id, { code: promocode.code })

        return createSuccessResponse(promocode, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/promocodes]', error)
        return serverError('Failed to create promocode')
    }
}
