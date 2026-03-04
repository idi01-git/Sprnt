import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminUserSubListQuerySchema } from '@/lib/validations/admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { userId } = await params

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminUserSubListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where = { userId }

        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { submittedAt: 'desc' },
                include: {
                    enrollment: {
                        include: {
                            course: {
                                select: {
                                    courseName: true,
                                    courseId: true,
                                }
                            }
                        }
                    }
                }
            }),
            prisma.submission.count({ where }),
        ])

        return createPaginatedResponse(submissions, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]/submissions]', error)
        return serverError()
    }
}
