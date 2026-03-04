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

        const identity = await prisma.identityVerification.findFirst({
            where: { submissionId }
        })

        if (!identity) {
            return notFound('Identity Verification')
        }

        let collegeIdPresignedUrl = identity.collegeIdUrl
        try {
            const key = new URL(identity.collegeIdUrl).pathname.slice(1)
            const result = await generatePresignedDownloadUrl(Bucket.PRIVATE, key)
            collegeIdPresignedUrl = result.url
        } catch {
            const result = await generatePresignedDownloadUrl(Bucket.PRIVATE, identity.collegeIdUrl)
            collegeIdPresignedUrl = result.url
        }

        return createSuccessResponse({
            ...identity,
            collegeIdUrl: collegeIdPresignedUrl,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]/identity]', error)
        return serverError()
    }
}
