import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        await requireAdminOrAbove()

        const certificates = await prisma.enrollment.findMany({
            where: {
                certificateIssued: true,
                certificateId: { not: null },
            },
            select: {
                id: true,
                certificateId: true,
                certificateIssued: true,
                enrolledAt: true,
                completedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        courseId: true,
                        courseName: true,
                        affiliatedBranch: true,
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
        })

        const items = certificates.map(c => ({
            id: c.id,
            certificateId: c.certificateId || 'N/A',
            studentName: c.user.name,
            studentEmail: c.user.email,
            courseName: c.course.courseName,
            courseId: c.course.courseId,
            branch: c.course.affiliatedBranch,
            issueDate: c.completedAt?.toISOString() || c.enrolledAt.toISOString(),
            enrolledAt: c.enrolledAt.toISOString(),
        }))

        return createSuccessResponse({ certificates: items })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates]', error)
        return serverError('Failed to fetch certificates')
    }
}