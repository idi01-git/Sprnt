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

        return createPaginatedResponse(enrollments, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/enrollments]', error)
        return serverError()
    }
}
