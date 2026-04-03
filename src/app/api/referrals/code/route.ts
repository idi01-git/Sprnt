import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/referrals/code
 * Get the user's referral code. Generates one if not yet assigned.
 * Only returns the code if user has at least one successful enrollment.
 * Auth: Session Cookie
 */
export async function GET(_request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        // Check if user has at least one successful enrollment
        const enrollmentCount = await prisma.enrollment.count({
            where: {
                userId: user.id,
                paymentStatus: 'success',
            },
        })

        // If no successful enrollments, don't show referral code yet
        if (enrollmentCount === 0) {
            return createSuccessResponse({
                code: null,
                isActive: false,
                shareUrl: null,
                reason: 'no_enrollment',
            })
        }

        let userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                referralCode: true,
            },
        })

        if (!userData) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'User not found',
                HttpStatus.NOT_FOUND
            )
        }

        // Auto-generate referral code if missing
        if (!userData.referralCode) {
            const code = generateReferralCode(user.id)
            userData = await prisma.user.update({
                where: { id: user.id },
                data: { referralCode: code },
                select: {
                    referralCode: true,
                },
            })
        }

        // Build shareable link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sprintern.com'
        const shareUrl = `${baseUrl}/register?ref=${userData.referralCode}`

        return createSuccessResponse({
            code: userData.referralCode,
            isActive: true,
            shareUrl,
        })
    } catch (error) {
        console.error('[GET /api/referrals/code]', error)
        return serverError('Failed to get referral code')
    }
}

/**
 * Generate a unique referral code from user ID + random suffix.
 */
function generateReferralCode(userId: string): string {
    const prefix = userId.slice(-4).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `SP${prefix}${random}`
}
