import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        await requireReviewerOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        })

        if (!submission) {
            return notFound('Submission')
        }

        return createSuccessResponse({
            message: 'Identity verification not available in MVP',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]/identity]', error)
        return serverError()
    }
}
