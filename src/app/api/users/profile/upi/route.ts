import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
import { updateUpiSchema } from '@/lib/validations/profile'
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * PUT /api/users/profile/upi
 * Add or update UPI ID with format validation
 */
export async function PUT(request: Request) {
    try {
        const authUser = await requireAuth()

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Request body is required')

        const result = updateUpiSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { upiId } = result.data

        const updatedUser = await prisma.user.update({
            where: { id: authUser.id },
            data: { upiId },
            select: { upiId: true, updatedAt: true },
        })

        return createSuccessResponse({ upiId: updatedUser.upiId })
    } catch (error) {
        if ((error as { digest?: string }).digest === 'NEXT_REDIRECT') throw error
        console.error('[PUT /api/users/profile/upi]', error)
        return serverError('Failed to update UPI ID')
    }
}
