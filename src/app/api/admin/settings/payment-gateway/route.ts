import { requireSuperAdmin, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireSuperAdmin()

        const keyId = process.env.RAZORPAY_KEY_ID ?? ''
        const hasSecret = !!process.env.RAZORPAY_KEY_SECRET
        const hasWebhookSecret = !!process.env.RAZORPAY_WEBHOOK_SECRET

        const masked = keyId.length > 4 ? `${keyId.slice(0, 4)}..${keyId.slice(-4)}` : '****'

        return createSuccessResponse({
            provider: 'Razorpay',
            keyId: masked,
            configured: hasSecret && keyId.length > 0,
            webhookConfigured: hasWebhookSecret,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/settings/payment-gateway]', error)
        return serverError()
    }
}
