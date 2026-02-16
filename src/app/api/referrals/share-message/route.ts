import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/referrals/share-message
 * Generate a WhatsApp-optimized share message with the user's referral link.
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

        const { prisma } = await import('@/lib/db')

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                referralCode: true,
                name: true,
            },
        })

        if (!userData?.referralCode) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Referral code not generated yet. Visit /api/referrals/code first.',
                HttpStatus.BAD_REQUEST
            )
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sprintern.com'
        const shareUrl = `${baseUrl}/register?ref=${userData.referralCode}`

        const message =
            `🎓 Hey! I'm learning on *Sprintern* and it's amazing!\n\n` +
            `Use my referral link to sign up and we both earn rewards:\n` +
            `👉 ${shareUrl}\n\n` +
            `#Sprintern #Learning #Internship`

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

        return createSuccessResponse({
            message,
            whatsappUrl,
            shareUrl,
            referralCode: userData.referralCode,
        })
    } catch (error) {
        console.error('[GET /api/referrals/share-message]', error)
        return serverError('Failed to generate share message')
    }
}
