import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, badRequest, conflict, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { adminManualEnrollSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { userId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminManualEnrollSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return notFound('User')

        const course = await prisma.course.findUnique({ 
            where: { courseId: parsed.data.courseId },
            select: { id: true, _count: { select: { modules: true } } },
        })
        if (!course) return notFound('Course')

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: course.id,
                }
            }
        })

        if (existingEnrollment) {
            return conflict('User is already enrolled in this course')
        }

        const moduleCount = course._count.modules || 7

        // Create enrollment with dailyProgress in a transaction
        const enrollment = await prisma.$transaction(async (tx) => {
            const newEnrollment = await tx.enrollment.create({
                data: {
                    userId,
                    courseId: course.id,
                    paymentStatus: 'success',
                    amountPaid: 0,
                    isAdminGranted: true,
                    adminGrantedBy: adminId,
                    adminGrantReason: parsed.data.reason,
                }
            })

            // Create dailyProgress records based on actual module count
            const records = Array.from({ length: moduleCount }, (_, i) => ({
                enrollmentId: newEnrollment.id,
                dayNumber: i + 1,
                isLocked: i !== 0,
                unlockedAt: i === 0 ? new Date() : null,
            }))
            await tx.dailyProgress.createMany({
                data: records,
                skipDuplicates: true,
            })

            return newEnrollment
        })

        await logAdminAction(adminId, 'user_manual_enroll', 'enrollment', enrollment.id, { courseId: course.id, reason: parsed.data.reason })

        return createSuccessResponse(enrollment, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/users/[userId]/manual-enroll]', error)
        return serverError()
    }
}
