import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
    type HttpStatusCode,
} from '@/lib/api-response'
import { type PaymentStatus, Prisma } from '@/generated/prisma/client'

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function getEnvOrThrow(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new PaymentError(
            `Missing required environment variable: ${key}`,
            'PAYMENT_CONFIG_ERROR',
            500,
        )
    }
    return value
}

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

/**
 * Structured error for payment operations.
 * Carries a machine-readable `code` and optional upstream Razorpay details.
 */
export class PaymentError extends Error {
    readonly code: string
    readonly statusCode: number
    readonly razorpayError?: Record<string, unknown>

    constructor(
        message: string,
        code: string = ErrorCode.PAYMENT_FAILED,
        statusCode: number = 500,
        razorpayError?: Record<string, unknown>,
    ) {
        super(message)
        this.name = 'PaymentError'
        this.code = code
        this.statusCode = statusCode
        this.razorpayError = razorpayError

        // Maintain proper stack trace (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PaymentError)
        }
    }
}

// =============================================================================
// TYPES
// =============================================================================

/** Razorpay order creation response (typed — no `any`) */
export interface PaymentOrder {
    readonly id: string
    readonly amount: number
    readonly currency: string
    readonly receipt: string
    readonly status: 'created' | 'attempted' | 'paid'
    readonly createdAt: Date
}

/** Typed webhook event payload from Razorpay */
export interface PaymentWebhookEvent {
    readonly event: WebhookEventType
    readonly createdAt: Date
    readonly payload: WebhookPayload
}

export type WebhookEventType =
    | 'payment.captured'
    | 'payment.failed'
    | 'payment.authorized'
    | 'order.paid'
    | 'refund.processed'

interface WebhookPayload {
    readonly payment?: {
        readonly entity: {
            readonly id: string
            readonly order_id: string
            readonly amount: number
            readonly currency: string
            readonly status: string
            readonly method: string
            readonly email: string
            readonly contact: string
        }
    }
    readonly order?: {
        readonly entity: {
            readonly id: string
            readonly amount: number
            readonly currency: string
            readonly status: string
            readonly receipt: string
        }
    }
}

/** Result of processing a webhook with idempotency */
export interface WebhookProcessingResult {
    readonly processed: boolean
    readonly enrollmentId: string
    readonly status: PaymentStatus
    readonly idempotent: boolean
}

/** Options for creating a Razorpay order */
export interface CreateOrderOptions {
    /** Amount in INR (will be converted to paise internally) */
    readonly amountInr: number
    readonly currency?: string
    readonly receipt: string
    /** Additional notes to attach to the order */
    readonly notes?: Record<string, string>
}

// =============================================================================
// 1. RAZORPAY CLIENT INITIALIZATION
// =============================================================================

/**
 * Razorpay HTTP client.
 * We use raw `fetch` instead of the Node SDK to avoid an extra dependency,
 * keep bundle size small, and retain full type control.
 *
 * All Razorpay REST calls go through `razorpayFetch`, which handles auth,
 * headers, and error translation automatically.
 */

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1'

async function razorpayFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const keyId = getEnvOrThrow('RAZORPAY_KEY_ID')
    const keySecret = getEnvOrThrow('RAZORPAY_KEY_SECRET')

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch(`${RAZORPAY_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
            ...options.headers,
        },
    })

    const body = await response.json() as Record<string, unknown>

    if (!response.ok) {
        const errorBody = body.error as Record<string, unknown> | undefined

        throw new PaymentError(
            (errorBody?.description as string) ?? `Razorpay API error (${response.status})`,
            ErrorCode.PAYMENT_FAILED,
            response.status,
            errorBody,
        )
    }

    return body as T
}

// =============================================================================
// 2. CREATE ORDER
// =============================================================================

/**
 * Create a Razorpay order (server-side).
 *
 * @param options - Order creation options
 * @returns Typed PaymentOrder with id, amount, currency, receipt, and status
 *
 * @example
 * ```ts
 * const order = await createOrder({
 *   amountInr: 499,           // ₹499
 *   receipt: `enroll_${enrollmentId}`,
 *   notes: { courseId, userId },
 * })
 * // → { id: 'order_xyz', amount: 49900, currency: 'INR', ... }
 * ```
 *
 * TEST: createOrder({ amountInr: 499, receipt: 'test_123' })
 *       → returns { id: string, amount: 49900, currency: 'INR', status: 'created' }
 */
export async function createOrder(options: CreateOrderOptions): Promise<PaymentOrder> {
    const { amountInr, currency = 'INR', receipt, notes } = options

    // Validate amount
    if (amountInr <= 0 || !Number.isFinite(amountInr)) {
        throw new PaymentError(
            'Amount must be a positive finite number',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amountInr * 100)

    // Minimum ₹1 (100 paise) — Razorpay requirement
    if (amountInPaise < 100) {
        throw new PaymentError(
            'Minimum order amount is ₹1 (100 paise)',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    interface RazorpayOrderResponse {
        id: string
        amount: number
        currency: string
        receipt: string
        status: 'created' | 'attempted' | 'paid'
        created_at: number
    }

    const order = await razorpayFetch<RazorpayOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: notes ?? {},
        }),
    })

    console.info('[Payments] Order created:', {
        orderId: order.id,
        amount: order.amount,
        receipt: order.receipt,
    })

    return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: new Date(order.created_at * 1000),
    }
}

// =============================================================================
// 3. VERIFY WEBHOOK SIGNATURE
// =============================================================================

/**
 * Verify the `X-Razorpay-Signature` header on incoming webhooks.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-attack leakage.
 *
 * @param rawBody  - The raw request body string (NOT parsed JSON)
 * @param signature - The value of the `X-Razorpay-Signature` header
 * @returns `true` if the signature is valid, `false` otherwise
 *
 * @example
 * ```ts
 * const isValid = verifyWebhookSignature(rawBody, req.headers['x-razorpay-signature'])
 * if (!isValid) return unauthorized('Invalid webhook signature')
 * ```
 *
 * TEST: verifyWebhookSignature('{"event":"payment.captured"}', 'valid_sig')
 *       → true when computed HMAC matches
 * TEST: verifyWebhookSignature('{"event":"payment.captured"}', 'tampered_sig')
 *       → false
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = getEnvOrThrow('RAZORPAY_WEBHOOK_SECRET')

    const expectedSignature = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

    // Both must be the same length for timingSafeEqual
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
        return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
}

// =============================================================================
// 4. VERIFY PAYMENT (Client-side backup verification)
// =============================================================================

/**
 * Verify a payment using the orderId + paymentId + signature triplet.
 * This is the client-side verification flow called after checkout.
 *
 * Razorpay signs:  HMAC_SHA256(orderId + "|" + paymentId, key_secret)
 *
 * @param orderId   - The Razorpay order ID
 * @param paymentId - The Razorpay payment ID
 * @param signature - The signature returned by Razorpay Checkout to the client
 * @returns `true` if the payment is authentic, `false` otherwise
 *
 * @example
 * ```ts
 * const isValid = verifyPayment(orderId, paymentId, razorpay_signature)
 * if (!isValid) return createErrorResponse('PAYMENT_VERIFICATION_FAILED', 'Tampered', 400)
 * ```
 *
 * TEST: verifyPayment('order_abc', 'pay_xyz', validSig) → true
 * TEST: verifyPayment('order_abc', 'pay_xyz', 'bad_sig') → false
 */
export function verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
): boolean {
    const keySecret = getEnvOrThrow('RAZORPAY_KEY_SECRET')

    const generatedSignature = createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex')

    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(generatedSignature, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
        return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
}

// =============================================================================
// 5. PARSE WEBHOOK EVENT
// =============================================================================

/**
 * Parse and type-narrow a raw Razorpay webhook payload.
 *
 * @param rawBody - The raw request body string
 * @returns Typed `PaymentWebhookEvent`
 * @throws PaymentError if the payload is malformed
 *
 * @example
 * ```ts
 * const event = parseWebhookEvent(rawBody)
 * if (event.event === 'payment.captured') {
 *   const paymentId = event.payload.payment?.entity.id
 * }
 * ```
 *
 * TEST: parseWebhookEvent('{"event":"payment.captured","created_at":1234,"payload":{...}}')
 *       → { event: 'payment.captured', createdAt: Date, payload: {...} }
 * TEST: parseWebhookEvent('malformed') → throws PaymentError
 */
export function parseWebhookEvent(rawBody: string): PaymentWebhookEvent {
    let parsed: Record<string, unknown>

    try {
        parsed = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
        throw new PaymentError(
            'Malformed webhook payload: invalid JSON',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    // Validate required fields
    if (typeof parsed.event !== 'string') {
        throw new PaymentError(
            'Malformed webhook payload: missing "event" field',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    if (typeof parsed.created_at !== 'number') {
        throw new PaymentError(
            'Malformed webhook payload: missing "created_at" field',
            ErrorCode.VALIDATION_ERROR,
            400,
        )
    }

    const payload = (parsed.payload ?? {}) as WebhookPayload

    return {
        event: parsed.event as WebhookEventType,
        createdAt: new Date((parsed.created_at as number) * 1000),
        payload,
    }
}

// =============================================================================
// 6. IDEMPOTENT WEBHOOK PROCESSOR
// =============================================================================

/**
 * Process a `payment.captured` webhook **exactly once**.
 *
 * Idempotency is guaranteed by the `paymentGatewayOrderId` UNIQUE constraint
 * on the Enrollment model. If a webhook fires 3 times for the same order,
 * only the first call mutates the database — subsequent calls return early
 * with `{ idempotent: true }`.
 *
 * @param orderId   - Razorpay order ID (e.g. `order_xyz`)
 * @param paymentId - Razorpay payment ID (e.g. `pay_abc`)
 * @param amount    - Amount in paise (used for mismatch validation)
 * @param metadata  - Optional metadata to store alongside the payment
 * @returns Processing result indicating whether the payment was freshly processed or idempotently skipped
 *
 * @example
 * ```ts
 * const result = await processPaymentWebhook('order_xyz', 'pay_abc', 49900)
 * if (result.idempotent) {
 *   console.log('Already processed, skipping')
 * }
 * ```
 */
export async function processPaymentWebhook(
    orderId: string,
    paymentId: string,
    amount: number,
    metadata?: Record<string, unknown>,
): Promise<WebhookProcessingResult> {
    // ─── Step 1: Idempotency check ───────────────────────────────────────
    // Find enrollment by Razorpay order ID
    const enrollment = await prisma.enrollment.findUnique({
        where: { paymentGatewayOrderId: orderId },
    })

    if (!enrollment) {
        throw new PaymentError(
            `No enrollment found for order: ${orderId}`,
            ErrorCode.PAYMENT_FAILED,
            404,
        )
    }

    // Already processed? Return idempotent response.
    if (enrollment.paymentStatus === 'success') {
        console.info('[Payments] Idempotent skip — already processed:', {
            enrollmentId: enrollment.id,
            orderId,
        })

        return {
            processed: false,
            enrollmentId: enrollment.id,
            status: 'success',
            idempotent: true,
        }
    }

    // ─── Step 2: Amount mismatch guard ───────────────────────────────────
    const expectedAmountPaise = enrollment.amountPaid.toNumber() * 100

    if (amount !== expectedAmountPaise) {
        console.error('[Payments] Amount mismatch:', {
            enrollmentId: enrollment.id,
            expected: expectedAmountPaise,
            received: amount,
        })

        // Mark as failed, don't process
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                paymentStatus: 'failed',
                paymentMetadata: {
                    error: 'amount_mismatch',
                    expectedPaise: expectedAmountPaise,
                    receivedPaise: amount,
                    timestamp: new Date().toISOString(),
                },
            },
        })

        throw new PaymentError(
            `Amount mismatch: expected ${expectedAmountPaise} paise, received ${amount} paise`,
            ErrorCode.PAYMENT_VERIFICATION_FAILED,
            400,
        )
    }

    // ─── Step 3: Mark as paid and initialize enrollment ───────────────────────
    await prisma.$transaction(async (tx) => {
        // Mark enrollment as successful
        await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
                paymentStatus: 'success',
                paymentGatewayPaymentId: paymentId,
                paymentMetadata: (metadata ?? {
                    processedAt: new Date().toISOString(),
                    gateway: 'razorpay',
                }) as unknown as Prisma.InputJsonValue,
            },
        })

        // Initialize all 7 days progress (Day 1 unlocked, Days 2-7 locked)
        const records = Array.from({ length: 7 }, (_, i) => ({
            enrollmentId: enrollment.id,
            dayNumber: i + 1,
            isLocked: i !== 0, // Day 1 is unlocked, rest are locked
            unlockedAt: i === 0 ? new Date() : null,
        }))
        await tx.dailyProgress.createMany({
            data: records,
            skipDuplicates: true,
        })

        // Record the transaction
        await tx.transaction.create({
            data: {
                userId: enrollment.userId,
                transactionType: 'course_purchase',
                amount: enrollment.amountPaid,
                paymentMethod: 'razorpay',
                enrollmentId: enrollment.id,
                gatewayTransactionId: paymentId,
                gatewayStatus: 'captured',
                status: 'completed',
            },
        })

        // Record promocode usage if applicable
        if (enrollment.promocodeUsed) {
            const promo = await tx.promocode.findUnique({
                where: { code: enrollment.promocodeUsed },
                select: { id: true },
            })

            if (promo) {
                await tx.promocodeUsage.create({
                    data: {
                        promocodeId: promo.id,
                        userId: enrollment.userId,
                        enrollmentId: enrollment.id,
                        discountApplied: enrollment.discountAmount,
                    },
                })

                // Increment global usage count
                await tx.promocode.update({
                    where: { id: promo.id },
                    data: { usageCount: { increment: 1 } },
                })
            }
        }

        // Handle referral: credit referrer if applicable
        const user = await tx.user.findUnique({
            where: { id: enrollment.userId },
            select: { referredBy: true },
        })

        if (user?.referredBy) {
            // Credit referrer's wallet
            const referralCreditAmount = 50 // Default ₹50 per PRD
            await tx.user.update({
                where: { id: user.referredBy },
                data: { walletBalance: { increment: referralCreditAmount } },
            })

            // Set 7-day lock period before withdrawal is eligible (per PRD)
            const withdrawalEligibleAt = new Date()
            withdrawalEligibleAt.setDate(withdrawalEligibleAt.getDate() + 7)

            // Create referral record
            await tx.referral.create({
                data: {
                    referrerId: user.referredBy,
                    refereeId: enrollment.userId,
                    referralCodeUsed: '', // Would need to look up
                    status: 'pending',
                    amount: referralCreditAmount,
                    withdrawalEligibleAt: withdrawalEligibleAt,
                },
            })

            // Create transaction for referrer
            await tx.transaction.create({
                data: {
                    userId: user.referredBy,
                    transactionType: 'referral_credit',
                    amount: referralCreditAmount,
                    enrollmentId: enrollment.id,
                },
            })
        }
    })

    console.info('[Payments] Payment processed successfully:', {
        enrollmentId: enrollment.id,
        orderId,
        paymentId,
        amount,
    })

    return {
        processed: true,
        enrollmentId: enrollment.id,
        status: 'success',
        idempotent: false,
    }
}

// =============================================================================
// 7. HANDLE FAILED PAYMENT WEBHOOK
// =============================================================================

/**
 * Handle a `payment.failed` webhook event.
 * Updates the enrollment status to 'failed' with error metadata.
 *
 * @param orderId - Razorpay order ID
 * @param reason  - Failure reason from Razorpay
 */
export async function processPaymentFailure(
    orderId: string,
    reason: string,
): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { paymentGatewayOrderId: orderId },
    })

    if (!enrollment) {
        console.warn('[Payments] No enrollment for failed payment:', orderId)
        return
    }

    // Don't overwrite a successful payment
    if (enrollment.paymentStatus === 'success') {
        console.warn('[Payments] Ignoring failure for already-paid enrollment:', enrollment.id)
        return
    }

    await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
            paymentStatus: 'failed',
            paymentMetadata: {
                failedAt: new Date().toISOString(),
                reason,
                gateway: 'razorpay',
            },
        },
    })

    console.info('[Payments] Payment failure recorded:', {
        enrollmentId: enrollment.id,
        orderId,
        reason,
    })
}

// =============================================================================
// 8. FULL WEBHOOK HANDLER (Convenience — wires everything together)
// =============================================================================

/**
 * End-to-end webhook handler. Drop into a Next.js route handler:
 *
 * @example
 * ```ts
 * // app/api/webhooks/razorpay/route.ts
 * import { handleRazorpayWebhook } from '@/lib/payments'
 *
 * export async function POST(request: Request) {
 *   return handleRazorpayWebhook(request)
 * }
 * ```
 */
export async function handleRazorpayWebhook(request: Request) {
    try {
        // 1. Read raw body
        const rawBody = await request.text()
        const signature = request.headers.get('x-razorpay-signature')

        if (!signature) {
            return createErrorResponse(
                ErrorCode.PAYMENT_VERIFICATION_FAILED,
                'Missing X-Razorpay-Signature header',
                HttpStatus.UNAUTHORIZED,
            )
        }

        // 2. Verify signature
        if (!verifyWebhookSignature(rawBody, signature)) {
            console.warn('[Payments] Invalid webhook signature')
            return createErrorResponse(
                ErrorCode.PAYMENT_VERIFICATION_FAILED,
                'Invalid webhook signature',
                HttpStatus.UNAUTHORIZED,
            )
        }

        // 3. Parse event
        const event = parseWebhookEvent(rawBody)

        console.info('[Payments] Webhook received:', {
            event: event.event,
            createdAt: event.createdAt.toISOString(),
        })

        // 4. Route by event type
        switch (event.event) {
            case 'payment.captured':
            case 'order.paid': {
                const payment = event.payload.payment?.entity
                const order = event.payload.order?.entity

                const orderId = payment?.order_id ?? order?.id
                const paymentId = payment?.id
                const amount = payment?.amount ?? order?.amount

                if (!orderId || !amount) {
                    return createErrorResponse(
                        ErrorCode.VALIDATION_ERROR,
                        'Missing orderId or amount in webhook payload',
                        HttpStatus.BAD_REQUEST,
                    )
                }

                const result = await processPaymentWebhook(
                    orderId,
                    paymentId ?? 'unknown',
                    amount,
                    { rawEvent: event.event },
                )

                return createSuccessResponse(result)
            }

            case 'payment.failed': {
                const failedPayment = event.payload.payment?.entity
                const failedOrderId = failedPayment?.order_id

                if (failedOrderId) {
                    await processPaymentFailure(
                        failedOrderId,
                        `Payment failed: ${failedPayment?.status ?? 'unknown'}`,
                    )
                }

                return createSuccessResponse({ acknowledged: true })
            }

            default:
                // Acknowledge unknown events to prevent retries
                console.info('[Payments] Ignoring unhandled event:', event.event)
                return createSuccessResponse({ acknowledged: true, event: event.event })
        }
    } catch (error) {
        if (error instanceof PaymentError) {
            console.error('[Payments] PaymentError:', {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
            })

            return createErrorResponse(
                error.code,
                error.message,
                error.statusCode as HttpStatusCode,
            )
        }

        console.error('[Payments] Unexpected webhook error:', error)
        return serverError('Payment webhook processing failed')
    }
}
