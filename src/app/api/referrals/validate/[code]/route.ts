import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/referrals/validate/{code}
 * Validate a referral code (used during registration).
 * No auth required — called before the user has an account.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params

        if (!code || code.length < 4) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid referral code format',
                HttpStatus.BAD_REQUEST
            )
        }

        const referrer = await prisma.user.findFirst({
            where: {
                referralCode: code,
                deletedAt: null,
            },
            select: {
                name: true,
                avatarUrl: true,
            },
        })

        if (!referrer) {
            return createSuccessResponse({
                valid: false,
                message: 'Referral code not found or inactive',
            })
        }

        return createSuccessResponse({
            valid: true,
            referrer: {
                name: referrer.name,
                avatarUrl: referrer.avatarUrl,
            },
        })
    } catch (error) {
        console.error('[GET /api/referrals/validate/[code]]', error)
        return serverError('Failed to validate referral code')
    }
}
