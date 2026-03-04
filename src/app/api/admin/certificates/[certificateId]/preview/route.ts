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

        if (!certificate) {
            return notFound('Certificate')
        }

        if (!certificate.certificateUrl) {
            return createSuccessResponse({ previewUrl: null })
        }

        let previewUrl = certificate.certificateUrl
        // Check if it's an R2 key or public URL
        if (!previewUrl.startsWith('http')) {
            const key = previewUrl.startsWith('/') ? previewUrl.slice(1) : previewUrl
            const result = await generatePresignedDownloadUrl(Bucket.PRIVATE, key)
            previewUrl = result.url
        } else if (previewUrl.includes(process.env.NEXT_PUBLIC_BASE_URL || 'localhost')) {
            // Already a public API route or similar, leave as is
        } else {
            // Let's try to extract pathname if it is an R2 url
            try {
                const urlObj = new URL(previewUrl)
                if (urlObj.hostname.includes('r2.cloudflarestorage.com') || urlObj.hostname.includes('pub-')) {
                    // Need to generate presigned
                    const key = urlObj.pathname.slice(1)
                    if (key) {
                        const result = await generatePresignedDownloadUrl(Bucket.PRIVATE, key)
                        previewUrl = result.url
                    }
                }
            } catch { }
        }


        return createSuccessResponse({ previewUrl })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates/[certificateId]/preview]', error)
        return serverError()
    }
}
