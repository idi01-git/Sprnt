import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireReviewerOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
        if (!submission) return notFound('Submission')

        const updated = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                assignedAdminId: adminId,
                reviewStatus: 'under_review',
                reviewStartedAt: new Date()
            },
        })

        await logAdminAction(adminId, 'submission_self_assigned', 'submission', submissionId)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PATCH /api/admin/submissions/[submissionId]/self-assign]', error)
        return serverError()
    }
}
