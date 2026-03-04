import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        // Verify webhook secret
        const secret = request.headers.get('x-webhook-secret')
        if (secret !== process.env.R2_WEBHOOK_SECRET) {
            return NextResponse.json({ status: 'unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => null)
        if (!body) return NextResponse.json({ status: 'bad_request' }, { status: 400 })

        const { r2Key, status: uploadStatus } = body

        if (r2Key && uploadStatus === 'completed') {
            await prisma.videoAsset.updateMany({
                where: { r2Key },
                data: { uploadStatus: 'completed' },
            })
        }

        // Log
        await prisma.webhookLog.create({
            data: {
                webhookType: 'r2_upload',
                payload: body,
                status: 'success',
            },
        })

        return NextResponse.json({ status: 'ok' })
    } catch (error) {
        console.error('[POST /api/webhooks/r2-upload]', error)
        return NextResponse.json({ status: 'error' }, { status: 500 })
    }
}
