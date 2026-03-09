import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleRazorpayWebhook } from '@/lib/payments'

export async function POST(request: Request) {
    return handleRazorpayWebhook(request)
}
