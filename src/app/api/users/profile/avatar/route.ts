import { prisma } from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/auth/guards'
import { generatePresignedUploadUrl, deleteFile, Bucket } from '@/lib/r2'
import { avatarUploadSchema } from '@/lib/validations/profile'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    unauthorized,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/users/profile/avatar
 * Generate presigned upload URL for avatar, then update user record
 */
export async function POST(request: Request) {
    try {
        const authUser = await requireAuth()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = avatarUploadSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { contentType } = result.data

        // Generate a unique key for the avatar
        const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
        const key = `avatars/${authUser.id}/avatar.${ext}`

        // Generate presigned upload URL (bucket, key, contentType)
        const presigned = await generatePresignedUploadUrl(
            Bucket.PUBLIC,
            key,
            contentType,
        )

        // The CDN URL is deterministic from the key
        const cdnUrl = `${process.env.R2_PUBLIC_URL || ''}/${key}`

        // Update user's avatar URL
        await prisma.user.update({
            where: { id: authUser.id },
            data: { avatarUrl: cdnUrl },
        })

        return createSuccessResponse({
            uploadUrl: presigned.url,
            avatarUrl: cdnUrl,
            expiresAt: presigned.expiresAt,
        })
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[POST /api/users/profile/avatar]', error)
        return serverError('Failed to generate avatar upload URL')
    }
}

/**
 * DELETE /api/users/profile/avatar
 * Remove avatar from R2 and clear user record
 */
export async function DELETE() {
    try {
        const authUser = await requireAuth()

        // Get current avatar URL
        const dbUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { avatarUrl: true },
        })

        if (dbUser?.avatarUrl) {
            // Extract key from URL and delete from R2
            const publicUrl = process.env.R2_PUBLIC_URL || ''
            const key = dbUser.avatarUrl.replace(`${publicUrl}/`, '')
            try {
                await deleteFile(Bucket.PUBLIC, key)
            } catch {
                // Non-critical: R2 object might already be gone
                console.warn('[DELETE avatar] R2 delete failed for key:', key)
            }
        }

        // Clear avatar URL in DB
        await prisma.user.update({
            where: { id: authUser.id },
            data: { avatarUrl: null },
        })

        return createSuccessResponse({ message: 'Avatar removed successfully' })
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[DELETE /api/users/profile/avatar]', error)
        return serverError('Failed to remove avatar')
    }
}
