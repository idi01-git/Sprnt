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
import { generatePresignedUploadUrl, Bucket, KeyPrefix } from '@/lib/r2'

function buildCdnUrl(key: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? ''
    return `${publicUrl}/${key}`
}

// =============================================================================
// POST /api/admin/courses/[courseId]/thumbnail — Upload thumbnail (presigned URL)
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

        // Validate content type (basic check)
        if (!contentType.startsWith('image/')) {
            return badRequest('Invalid file type. Only images are allowed.')
        }

        const key = `${KeyPrefix.THUMBNAILS}${courseId}-${Date.now()}-${fileName}`
        const cdnUrl = buildCdnUrl(key)

        const { url } = await generatePresignedUploadUrl(
            Bucket.PUBLIC,
            key,
            contentType,
        )

        await prisma.course.update({
            where: { courseId },
            data: {
                courseThumbnail: cdnUrl,
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
        console.error('[POST /api/admin/courses/[courseId]/thumbnail]', error)
        return serverError('Failed to generate thumbnail upload URL')
    }
}
