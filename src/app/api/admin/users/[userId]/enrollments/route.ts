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

        const where = { userId, deletedAt: null }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { enrolledAt: 'desc' },
                include: {
                    course: {
                        select: {
                            courseName: true,
                            slug: true,
                            courseId: true,
                            _count: {
                                select: { modules: true },
                            },
                        }
                    }
                }
            }),
            prisma.enrollment.count({ where }),
        ])

        // Format enrollments to match what the admin UI expects
        const formattedEnrollments = enrollments.map(e => ({
            id: e.id,
            courseName: e.course.courseName,
            courseSlug: e.course.slug,
            courseId: e.course.courseId,
            currentDay: e.currentDay,
            totalDays: e.course._count.modules > 0 ? e.course._count.modules : 7,
            status: e.completedAt ? 'completed' : e.paymentStatus === 'failed' ? 'failed' : 'in_progress',
            enrolledAt: e.enrolledAt.toISOString(),
            completedAt: e.completedAt?.toISOString() ?? null,
            paymentStatus: e.paymentStatus,
            amountPaid: Number(e.amountPaid),
        }))

        return createPaginatedResponse(formattedEnrollments, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/users/[userId]/enrollments]', error)
        return serverError()
    }
}
