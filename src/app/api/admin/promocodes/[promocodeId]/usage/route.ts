import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminPromocodeUsageQuerySchema } from '@/lib/validations/admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ promocodeId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { promocodeId } = await params

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminPromocodeUsageQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where = { promocodeId }

        const [usages, total] = await Promise.all([
            prisma.promocodeUsage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { usedAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } },
                    enrollment: {
                        include: {
                            course: { select: { courseName: true } }
                        }
                    },
                }
            }),
            prisma.promocodeUsage.count({ where }),
        ])

        return createPaginatedResponse(usages, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/promocodes/[promocodeId]/usage]', error)
        return serverError()
    }
}
