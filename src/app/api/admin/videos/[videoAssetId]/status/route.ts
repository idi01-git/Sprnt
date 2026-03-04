import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

// =============================================================================
// GET /api/admin/videos/[videoAssetId]/status — Status check
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ videoAssetId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { videoAssetId } = await params

        const video = await prisma.videoAsset.findUnique({
            where: { id: videoAssetId },
            select: {
                id: true,
                uploadStatus: true,
                processingStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!video) return notFound('Video asset')

        return createSuccessResponse(video)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/videos/[videoAssetId]/status]', error)
        return serverError()
    }
}
