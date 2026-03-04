import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
// import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const body = await request.text()
        const signature = request.headers.get('x-razorpay-signature')

        // TODO: Verify signature when Razorpay is live
        // const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        //     .update(body).digest('hex')
        // if (expectedSig !== signature) {
        //     await prisma.webhookLog.create({ data: { webhookType: 'razorpay', payload: {}, status: 'failed', errorMessage: 'Invalid signature' } })
        //     return NextResponse.json({ status: 'invalid_signature' }, { status: 401 })
        // }

        const payload = JSON.parse(body)
        const event = payload?.event

        // Log incoming webhook
        await prisma.webhookLog.create({
            data: {
                webhookType: 'razorpay',
                payload: payload,
                status: 'success',
            },
        })

        // TODO: Handle different event types when Razorpay is live:
        // - payment.captured → update enrollment paymentStatus to 'success'
        // - payment.failed → update enrollment paymentStatus to 'failed'
        // - refund.processed → update enrollment paymentStatus to 'refunded'
        console.info(`[webhook/razorpay] Received ${event || 'unknown'} event`)

        // Always return 200 — Razorpay retries on non-200
        return NextResponse.json({ status: 'ok' })
    } catch (error) {
        console.error('[POST /api/webhooks/razorpay]', error)

        // Still return 200 to prevent retry loops
        await prisma.webhookLog.create({
            data: {
                webhookType: 'razorpay',
                payload: {},
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
        }).catch(() => { })

        return NextResponse.json({ status: 'error' })
    }
}
