import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminRejectSubmissionSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { submissionId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminRejectSubmissionSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
        if (!submission) return notFound('Submission')

        const updated = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                reviewStatus: 'rejected',
                adminNotes: parsed.data.adminNotes,
                reviewCompletedAt: new Date(),
                resubmissionCount: { increment: 1 }, // Increment resubmission count
            },
        })

        const canResubmit = updated.resubmissionCount < updated.maxResubmissions

        await prisma.notification.create({
            data: {
                userId: submission.userId,
                type: 'submission_rejected',
                title: 'Submission Requires Changes',
                message: canResubmit
                    ? `Your submission was not approved. You can resubmit (${updated.maxResubmissions - updated.resubmissionCount} attempts remaining).`
                    : `Your submission was not approved. Maximum resubmission attempts reached.`,
            },
        })

        await logAdminAction(adminId, 'submission_rejected', 'submission', submissionId)

        return createSuccessResponse({ message: 'Submission rejected', canResubmit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/submissions/[submissionId]/reject]', error)
        return serverError()
    }
}
