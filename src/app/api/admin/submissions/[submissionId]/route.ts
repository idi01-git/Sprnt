import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        await requireReviewerOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
                enrollment: {
                    include: {
                        course: { select: { courseName: true, courseId: true, affiliatedBranch: true } }
                    }
                },
                assignedAdmin: { select: { username: true, email: true } },
                identityVerification: true,
                submissionVersions: { orderBy: { versionNumber: 'desc' } },
            },
        })

        if (!submission) {
            return notFound('Submission')
        }

        return createSuccessResponse(submission)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]]', error)
        return serverError()
    }
}
