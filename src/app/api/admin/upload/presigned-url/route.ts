import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'
import { adminPresignedUrlSchema } from '@/lib/validations/admin'
import { generatePresignedUploadUrl, Bucket, KeyPrefix } from '@/lib/r2'

function buildCdnUrl(key: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? ''
    return `${publicUrl}/${key}`
}

// =============================================================================
// POST /api/admin/upload/presigned-url — Generate R2 upload URL
// =============================================================================

export async function POST(request: Request) {
    try {
        await requireAdminOrAbove()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminPresignedUrlSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', {
                errors: parsed.error.flatten().fieldErrors,
            })
        }

        const { fileName, fileType, bucket, maxSizeMB } = parsed.data

        // Convert bucket enum to actual bucket name constant
        // adminPresignedUrlSchema allows 'sprintern-public' | 'sprintern-private'
        // r2.ts has Bucket.PUBLIC = 'sprintern-public', Bucket.PRIVATE = 'sprintern-private'
        // So we can use the value directly, but good to be explicit.
        const r2Bucket = bucket === 'sprintern-private' ? Bucket.PRIVATE : Bucket.PUBLIC

        // Determine key prefix based on file type or context?
        // The endpoint is generic. Let's use 'uploads/' as a generic prefix
        // or try to infer from fileType.
        // For video files, we should probably use KeyPrefix.VIDEOS if it looks like a video.
        let prefix = 'uploads/'
        if (fileType.startsWith('video/')) prefix = KeyPrefix.VIDEOS
        else if (fileType === 'application/pdf') prefix = 'documents/'
        else if (fileType.startsWith('image/')) prefix = 'images/'

        // Sanitize filename
        const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const key = `${prefix}${Date.now()}_${sanitized}`
        const cdnUrl = buildCdnUrl(key)

        const { url } = await generatePresignedUploadUrl(
            r2Bucket,
            key,
            fileType,
        )

        return createSuccessResponse({
            uploadUrl: url,
            key,
            cdnUrl,
            bucket: r2Bucket,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[POST /api/admin/upload/presigned-url]', error)
        return serverError('Failed to generate presigned URL')
    }
}
