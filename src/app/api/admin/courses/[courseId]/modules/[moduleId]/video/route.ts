import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminAttachVideoSchema } from '@/lib/validations/admin'
import { deleteFile, Bucket } from '@/lib/r2'

// =============================================================================
// Helper: Verify module
// =============================================================================

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
        include: { videoAssets: true },
    })
}

// =============================================================================
// POST /api/admin/courses/[courseId]/modules/[moduleId]/video — Attach video
// =============================================================================

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        // Check if module already has a video attached?
        // Schema allows many VideoAssets per CourseModule (one-to-many).
        // But business logic might enforce 1 video per module?
        // Implementation plan says "If module already has video -> 409".
        // Let's enforce single video per module for now as per plan.
        if (module.videoAssets.length > 0) {
            return conflict('Module already has a video attached. Delete it first.')
        }

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminAttachVideoSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        const video = await prisma.videoAsset.create({
            data: {
                courseModuleId: module.id,
                r2Key: data.r2Key,
                r2Bucket: Bucket.PRIVATE,
                cdnUrl: '',
                fileSizeBytes: data.fileSizeBytes,
                durationSeconds: data.durationSeconds,
                resolution: data.resolution,
                uploadStatus: 'pending',
                processingStatus: 'processing',
            },
        })

        // Serialize BigInt for JSON response
        return createSuccessResponse({
            ...video,
            fileSizeBytes: video.fileSizeBytes.toString(),
        }, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error(
            '[POST /api/admin/courses/[courseId]/modules/[moduleId]/video]',
            error,
        )
        return serverError('Failed to attach video')
    }
}

// =============================================================================
// DELETE /api/admin/courses/[courseId]/modules/[moduleId]/video — Remove video
// =============================================================================

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        const video = module.videoAssets[0]
        if (!video) return notFound('Video asset')

        // Delete from R2
        try {
            await deleteFile(video.r2Bucket, video.r2Key)
        } catch (e) {
            console.warn('Failed to delete video from R2:', e)
        }

        // Delete from DB
        await prisma.videoAsset.delete({
            where: { id: video.id },
        })

        return createSuccessResponse({ message: 'Video detached and deleted' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error(
            '[DELETE /api/admin/courses/[courseId]/modules/[moduleId]/video]',
            error,
        )
        return serverError('Failed to delete video')
    }
}
