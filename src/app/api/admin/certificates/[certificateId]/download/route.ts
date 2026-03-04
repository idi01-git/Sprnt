import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { generatePresignedDownloadUrl, Bucket } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        await requireAdminOrAbove()
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            select: { certificateUrl: true }
        })

        if (!certificate || !certificate.certificateUrl) {
            return notFound('Certificate PDF')
        }

        let key = certificate.certificateUrl
        try {
            const urlObj = new URL(certificate.certificateUrl)
            key = urlObj.pathname.slice(1)
        } catch {
            if (key.startsWith('/')) key = key.slice(1)
        }

        const result = await generatePresignedDownloadUrl(Bucket.PRIVATE, key)

        return createSuccessResponse({ downloadUrl: result.url })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates/[certificateId]/download]', error)
        return serverError()
    }
}
