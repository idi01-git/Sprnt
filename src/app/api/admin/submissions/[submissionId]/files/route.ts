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
            projectFileUrl: null,
            reportPdfUrl: null,
            message: 'File tracking not available in current schema',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]/files]', error)
        return serverError()
    }
}
