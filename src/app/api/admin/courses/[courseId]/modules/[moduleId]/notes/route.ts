import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
} from '@/lib/api-response'
import { adminFileUploadSchema } from '@/lib/validations/admin'
import { generatePresignedUploadUrl, deleteFile, Bucket, KeyPrefix } from '@/lib/r2'

async function findModule(courseId: string, moduleId: string) {
    return prisma.courseModule.findFirst({
        where: { id: moduleId, course: { courseId } },
        select: {
            id: true,
            notesPdfUrl: true,
            notesR2Key: true,
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

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminFileUploadSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { fileName, contentType } = parsed.data

        if (contentType !== 'application/pdf') {
            return badRequest('Invalid file type. Only PDF allowed for notes.')
        }

        const key = `${KeyPrefix.NOTES}${courseId}/${moduleId}-${Date.now()}-${fileName}`

        const { url } = await generatePresignedUploadUrl(
            Bucket.PRIVATE,
            key,
            contentType,
        )

        await prisma.courseModule.update({
            where: { id: moduleId },
            data: {
                notesR2Key: key,
                notesPdfUrl: null,
            },
        })

        return createSuccessResponse({
            uploadUrl: url,
            key,
            bucket: Bucket.PRIVATE,
        })
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

        if (module.notesR2Key) {
            try {
                await deleteFile(Bucket.PRIVATE, module.notesR2Key)
            } catch (e) {
                console.warn('Failed to delete notes PDF from private bucket:', e)
            }
        }

        if (module.notesPdfUrl) {
            try {
                const urlObj = new URL(module.notesPdfUrl)
                const key = urlObj.pathname.slice(1)
                if (key) {
                    await deleteFile(Bucket.PUBLIC, key)
                }
            } catch (e) {
                console.warn('Failed to delete notes PDF from public bucket:', e)
            }
        }

        await prisma.courseModule.update({
            where: { id: moduleId },
            data: { notesR2Key: null, notesPdfUrl: null },
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
