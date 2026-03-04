import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminUpdateVideoSchema } from '@/lib/validations/admin'
import { deleteFile } from '@/lib/r2'

// =============================================================================
// Helper: Find video
// =============================================================================

async function findVideo(id: string) {
    return prisma.videoAsset.findUnique({
        where: { id },
        include: {
            courseModule: {
                select: {
                    id: true,
                    title: true,
                    course: {
                        select: { id: true, courseName: true },
                    },
                },
            },
        },
    })
}

// =============================================================================
// GET /api/admin/videos/[videoAssetId] — Video detail
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ videoAssetId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { videoAssetId } = await params

        const video = await findVideo(videoAssetId)
        if (!video) return notFound('Video asset')

        return createSuccessResponse({
            ...video,
            fileSizeBytes: video.fileSizeBytes.toString(),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/videos/[videoAssetId]]', error)
        return serverError()
    }
}

// =============================================================================
// PUT /api/admin/videos/[videoAssetId] — Update metadata
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ videoAssetId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { videoAssetId } = await params

        const video = await findVideo(videoAssetId)
        if (!video) return notFound('Video asset')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateVideoSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const updated = await prisma.videoAsset.update({
            where: { id: videoAssetId },
            data: parsed.data,
        })

        return createSuccessResponse({
            ...updated,
            fileSizeBytes: updated.fileSizeBytes.toString(),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/videos/[videoAssetId]]', error)
        return serverError()
    }
}

// =============================================================================
// DELETE /api/admin/videos/[videoAssetId] — Delete video asset
// =============================================================================

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ videoAssetId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { videoAssetId } = await params

        const video = await findVideo(videoAssetId)
        if (!video) return notFound('Video asset')

        // Delete from R2
        try {
            await deleteFile(video.r2Bucket, video.r2Key)
        } catch (e) {
            console.warn('Failed to delete video from R2:', e)
        }

        // Delete from DB
        await prisma.videoAsset.delete({
            where: { id: videoAssetId },
        })

        return createSuccessResponse({ message: 'Video asset deleted' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[DELETE /api/admin/videos/[videoAssetId]]', error)
        return serverError()
    }
}
