import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminSubmissionListQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireReviewerOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminSubmissionListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { status, search, courseId, page, limit, sort } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.SubmissionWhereInput = {}

        if (status !== 'all') {
            where.reviewStatus = status
        }

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            }
        }

        if (courseId) {
            where.enrollment = {
                course: {
                    courseId
                }
            }
        }

        const orderBy = sort === 'oldest' ? { submittedAt: 'asc' as const } : { submittedAt: 'desc' as const }

        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    user: { select: { name: true, email: true, avatarUrl: true } },
                    enrollment: {
                        include: {
                            course: { select: { courseName: true, courseId: true } }
                        }
                    },
                    assignedAdmin: { select: { username: true } },
                }
            }),
            prisma.submission.count({ where }),
        ])

        return createPaginatedResponse(submissions, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions]', error)
        return serverError()
    }
}
