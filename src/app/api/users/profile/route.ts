import { prisma } from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/auth/guards'
import { updateProfileSchema } from '@/lib/validations/profile'
import {
    createSuccessResponse,
    createErrorResponse,
    unauthorized,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/users/profile
 * Return full profile for the authenticated user
 */
export async function GET() {
    try {
        const authUser = await requireAuth()

        const profile = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                dob: true,
                studyLevel: true,
                avatarUrl: true,
                role: true,
                referralCode: true,
                emailVerified: true,
                phoneVerified: true,
                walletBalance: true,
                upiId: true,
                createdAt: true,
            },
        })

        if (!profile) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'User profile not found',
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({ profile })
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[GET /api/users/profile]', error)
        return serverError('Failed to fetch profile')
    }
}

/**
 * PUT /api/users/profile
 * Update editable profile fields
 */
export async function PUT(request: Request) {
    try {
        const authUser = await requireAuth()

        const body = await request.json().catch(() => null)
        if (!body) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Request body is required',
                HttpStatus.BAD_REQUEST
            )
        }

        const result = updateProfileSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const data = result.data

        // Build update object (only include provided fields)
        const updateData: Record<string, unknown> = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.phone !== undefined) updateData.phone = data.phone
        if (data.dob !== undefined) updateData.dob = data.dob
        if (data.studyLevel !== undefined) updateData.studyLevel = data.studyLevel

        if (Object.keys(updateData).length === 0) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'No fields to update',
                HttpStatus.BAD_REQUEST
            )
        }

        const updatedProfile = await prisma.user.update({
            where: { id: authUser.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                dob: true,
                studyLevel: true,
                avatarUrl: true,
                updatedAt: true,
            },
        })

        return createSuccessResponse({ profile: updatedProfile })
    } catch (error) {
        if (error instanceof AuthError) return unauthorized()
        console.error('[PUT /api/users/profile]', error)
        return serverError('Failed to update profile')
    }
}
