import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    notFound,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminFileUploadSchema } from '@/lib/validations/admin'
import { generatePresignedUploadUrl, deleteFile, Bucket, KeyPrefix } from '@/lib/r2'

function buildCdnUrl(key: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? ''
    return `${publicUrl}/${key}`
}

// =============================================================================
// POST /api/admin/courses/[courseId]/transcript — Upload transcript PDF
// =============================================================================

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

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
            return badRequest('Invalid file type. Only PDF allowed for transcript.')
        }

        const key = `${KeyPrefix.TRANSCRIPTS}${courseId}-${Date.now()}-${fileName}`
        const cdnUrl = buildCdnUrl(key)

        const { url } = await generatePresignedUploadUrl(
            Bucket.PUBLIC,
            key,
            contentType,
        )

        await prisma.course.update({
            where: { courseId },
            data: {
                courseTranscriptUrl: cdnUrl,
            },
        })

        return createSuccessResponse({
            uploadUrl: url,
            key,
            cdnUrl,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/courses/[courseId]/transcript]', error)
        return serverError('Failed to generate transcript upload URL')
    }
}

// =============================================================================
// DELETE /api/admin/courses/[courseId]/transcript — Remove transcript
// =============================================================================

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ courseId: string }> },
) {
    try {
        await requireAdminOrAbove()
        const { courseId } = await params

        const course = await prisma.course.findUnique({ where: { courseId } })
        if (!course) return notFound('Course')

        if (course.courseTranscriptUrl) {
            try {
                const urlObj = new URL(course.courseTranscriptUrl)
                const key = urlObj.pathname.slice(1)
                if (key) {
                    await deleteFile(Bucket.PUBLIC, key)
                }
            } catch (e) {
                console.warn('Failed to parse/delete old transcript file:', e)
            }
        }

        await prisma.course.update({
            where: { courseId },
            data: { courseTranscriptUrl: null },
        })

        return createSuccessResponse({ message: 'Transcript removed' })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[DELETE /api/admin/courses/[courseId]/transcript]', error)
        return serverError('Failed to remove transcript')
    }
}
