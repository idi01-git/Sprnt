import { prisma } from '@/lib/db'
import {
    requireAdminOrAbove,
    requireSuperAdmin,
    AuthError,
} from '@/lib/auth/guards'
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
import { adminUpdateModuleSchema } from '@/lib/validations/admin'

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: {
            id: moduleId,
            course: { courseId },
        },
    })
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        return createSuccessResponse({
            ...module,
            createdAt: module.createdAt.toISOString(),
            updatedAt: module.updatedAt.toISOString(),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/courses/[courseId]/modules/[moduleId]]', error)
        return serverError()
    }
}

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
                youtubeUrl: data.youtubeUrl,
                notesPdfUrl: data.notesPdfUrl,
            },
        })

        return createSuccessResponse({
            module: {
                ...updated,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            },
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[PUT /api/admin/courses/[courseId]/modules/[moduleId]]', error)
        return serverError()
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireSuperAdmin()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        const usageCount = await prisma.dailyProgress.count({
            where: {
                enrollment: { courseId: module.courseId },
                dayNumber: module.dayNumber,
            },
        })

        if (usageCount > 0) {
            return conflict(
                `Cannot delete module. ${usageCount} student(s) have progress on Day ${module.dayNumber}.`,
            )
        }

        await prisma.courseModule.delete({
            where: { id: moduleId },
        })

        return createSuccessResponse({ success: true })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(ErrorCode.ADMIN_AUTH_REQUIRED, 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[DELETE /api/admin/courses/[courseId]/modules/[moduleId]]',
            error,
        )
        return serverError()
    }
}
