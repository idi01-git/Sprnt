import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminAssignSubmissionSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { submissionId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminAssignSubmissionSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
        if (!submission) return notFound('Submission')

        const targetAdmin = await prisma.admin.findUnique({ where: { id: parsed.data.adminId } })
        if (!targetAdmin || !targetAdmin.isActive) {
            return notFound('Target Admin')
        }

        const updated = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                assignedAdminId: parsed.data.adminId,
                reviewStatus: 'under_review',
                reviewStartedAt: new Date()
            },
        })

        await logAdminAction(adminId, 'submission_assigned', 'submission', submissionId, { assignedTo: parsed.data.adminId })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/submissions/[submissionId]/assign]', error)
        return serverError()
    }
}
