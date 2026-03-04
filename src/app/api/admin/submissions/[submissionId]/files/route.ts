import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { generatePresignedDownloadUrl, Bucket } from '@/lib/r2'

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
            include: { identityVerification: true }
        })

        if (!submission) {
            return notFound('Submission')
        }

        const extractKey = (url: string) => {
            try {
                return new URL(url).pathname.slice(1)
            } catch {
                return url
            }
        }

        const [projectUrl, reportUrl] = await Promise.all([
            generatePresignedDownloadUrl(Bucket.PRIVATE, extractKey(submission.projectFileUrl)),
            generatePresignedDownloadUrl(Bucket.PRIVATE, extractKey(submission.reportPdfUrl)),
        ])

        let collegeIdUrl = null
        if (submission.identityVerification?.collegeIdUrl) {
            const collegeIdResult = await generatePresignedDownloadUrl(Bucket.PRIVATE, extractKey(submission.identityVerification.collegeIdUrl))
            collegeIdUrl = collegeIdResult.url
        }

        return createSuccessResponse({
            projectFileUrl: projectUrl.url,
            reportPdfUrl: reportUrl.url,
            collegeIdUrl,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]/files]', error)
        return serverError()
    }
}
