import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createPaginatedResponse,
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminCourseEnrollmentsQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

// =============================================================================
// GET /api/admin/courses/[courseId]/enrollments — List enrollments
// =============================================================================

export async function GET(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        const url = new URL(request.url)
        const query = Object.fromEntries(url.searchParams)
        const parsed = adminCourseEnrollmentsQuerySchema.safeParse(query)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { status, page, limit } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.EnrollmentWhereInput = {
            courseId: course.id, // Use internal ID for relation
            deletedAt: null, // Only show non-deleted enrollments
        }

        if (status !== 'all') {
            where.paymentStatus = status
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { enrolledAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

        // Format enrollments to match what the admin UI expects
        const formattedEnrollments = enrollments.map(e => ({
            id: e.id,
            userId: e.userId,
            userName: e.user.name,
            userEmail: e.user.email,
            userPhone: e.user.phone,
            status: e.completedAt ? 'completed' : e.paymentStatus === 'failed' ? 'failed' : 'in_progress',
            paymentStatus: e.paymentStatus,
            amountPaid: Number(e.amountPaid),
            enrolledAt: e.enrolledAt.toISOString(),
            completedAt: e.completedAt?.toISOString() ?? null,
            currentDay: e.currentDay,
        }))

        return createPaginatedResponse({ enrollments: formattedEnrollments }, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/enrollments]', error)
        return serverError()
    }
}
