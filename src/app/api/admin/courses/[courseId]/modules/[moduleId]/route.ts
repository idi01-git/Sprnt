import { prisma } from '@/lib/db'
import {
    requireAdminOrAbove,
    requireSuperAdmin,
    AuthError,
} from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminUpdateModuleSchema } from '@/lib/validations/admin'
import { deleteFile, Bucket } from '@/lib/r2'

// =============================================================================
// Helper: Find module by ID + Course context
// =============================================================================

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: {
            id: moduleId,
            course: { courseId }, // Ensure module belongs to this course
        },
        include: {
            videoAssets: true,
        },
    })
}

// =============================================================================
// GET /api/admin/courses/[courseId]/modules/[moduleId] — Module detail
// =============================================================================

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        return createSuccessResponse(module)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/modules/[moduleId]]', error)
        return serverError()
    }
}

// =============================================================================
// PUT /api/admin/courses/[courseId]/modules/[moduleId] — Update module
// =============================================================================

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminUpdateModuleSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const data = parsed.data

        // If day number changes, check for collision
        if (data.dayNumber && data.dayNumber !== module.dayNumber) {
            const collision = await prisma.courseModule.findFirst({
                where: {
                    courseId: module.courseId,
                    dayNumber: data.dayNumber,
                },
            })
            if (collision) {
                return conflict(`Day ${data.dayNumber} is already taken`)
            }
        }

        const updated = await prisma.courseModule.update({
            where: { id: moduleId },
            data: {
                dayNumber: data.dayNumber,
                title: data.title,
                contentText: data.contentText,
                isFreePreview: data.isFreePreview,
            },
        })

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/courses/[courseId]/modules/[moduleId]]', error)
        return serverError()
    }
}

// =============================================================================
// DELETE /api/admin/courses/[courseId]/modules/[moduleId] — Delete module
// =============================================================================

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireSuperAdmin()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        // Check for student progress
        const usageCount = await prisma.dailyProgress.count({
            where: {
                enrollment: { courseId: module.courseId }, // Filter by course + dayNumber?
                // Wait, DailyProgress links to Enrollment (which links to Course) + dayNumber
                dayNumber: module.dayNumber,
            },
        })

        if (usageCount > 0) {
            return conflict(
                `Cannot delete module. ${usageCount} student(s) have progress on Day ${module.dayNumber}.`,
            )
        }

        // Clean up assets (videos, notes) from R2
        // We do this in a background promise or inline? Inline for safety.
        if (module.notesPdfUrl) {
            try {
                const urlObj = new URL(module.notesPdfUrl)
                const key = urlObj.pathname.slice(1)
                await deleteFile(Bucket.PUBLIC, key)
            } catch (e) {
                console.warn('Failed to delete notes PDF:', e)
            }
        }

        for (const video of module.videoAssets) {
            if (video.r2Key) {
                // If it's a private bucket/video, we might need logic, but for now assuming public/private match
                // R2 implementation handles errors gracefully
                await deleteFile(video.r2Bucket || Bucket.PUBLIC, video.r2Key)
            }
        }

        await prisma.courseModule.delete({
            where: { id: moduleId },
        })

        return createSuccessResponse({ message: 'Module deleted' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[DELETE /api/admin/courses/[courseId]/modules/[moduleId]]',
            error,
        )
        return serverError()
    }
}
