import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
        select: {
            id: true,
            notesPdfUrl: true,
        },
    })
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        return createSuccessResponse({ message: 'Notes upload not available in MVP' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[POST /api/admin/courses/[courseId]/modules/[moduleId]/notes]',
            error,
        )
        return serverError()
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string; moduleId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId, moduleId } = await params

        const module = await findModule(courseId, moduleId)
        if (!module) return notFound('Module')

        await prisma.courseModule.update({
            where: { id: moduleId },
            data: { notesPdfUrl: null },
        })

        return createSuccessResponse({ message: 'Notes PDF removed' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error(
            '[DELETE /api/admin/courses/[courseId]/modules/[moduleId]/notes]',
            error,
        )
        return serverError()
    }
}
