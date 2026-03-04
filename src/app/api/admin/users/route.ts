import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, badRequest, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminUserListQuerySchema } from '@/lib/validations/admin'
import type { Prisma, StudyLevel } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminUserListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { search, status, studyLevel, sort, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.UserWhereInput = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (status === 'active') {
            where.deletedAt = null
        } else if (status === 'suspended') {
            where.deletedAt = { not: null }
        }

        if (studyLevel) {
            where.studyLevel = studyLevel as StudyLevel
        }

        let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' }
        if (sort === 'name') {
            orderBy = { name: 'asc' }
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: { enrollments: true, submissions: true, certificates: true }
                    }
                }
            }),
            prisma.user.count({ where }),
        ])

        return createPaginatedResponse(users, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[GET /api/admin/users]', error)
        return serverError('Failed to fetch users')
    }
}
