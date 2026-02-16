import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { verifyPaymentSchema } from '@/lib/validations/enrollment'
import { verifyPayment } from '@/lib/payments'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/enroll/verify-payment
 * Client-side payment verification: validate Razorpay signature,
 * update enrollment status as backup to webhook.
 * Auth: Session Cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const body = await request.json()
        const result = verifyPaymentSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = result.data

        // Verify the Razorpay signature
        const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)

        if (!isValid) {
            return createErrorResponse(
                ErrorCode.PAYMENT_VERIFICATION_FAILED,
                'Payment signature verification failed',
                HttpStatus.BAD_REQUEST
            )
        }

        // Find the enrollment by order ID
        const enrollment = await prisma.enrollment.findUnique({
            where: { paymentGatewayOrderId: razorpayOrderId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                promocodeUsed: true,
                discountAmount: true,
                amountPaid: true,
            },
        })

        if (!enrollment) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_NOT_FOUND,
                'Enrollment not found for this order',
                HttpStatus.NOT_FOUND
            )
        }

        // Verify ownership
        if (enrollment.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'You do not own this enrollment',
                HttpStatus.FORBIDDEN
            )
        }

        // If already processed (webhook beat us), return success
        if (enrollment.paymentStatus === 'success') {
            return createSuccessResponse({
                enrollmentId: enrollment.id,
                status: 'success',
                message: 'Payment already verified',
            })
        }

        // Update enrollment to success + create Day 1 progress + record transaction
        await prisma.$transaction(async (tx) => {
            // Mark enrollment as successful
            await tx.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    paymentStatus: 'success',
                    paymentGatewayPaymentId: razorpayPaymentId,
                },
            })

            // Initialize Day 1 progress (unlocked)
            await tx.dailyProgress.create({
                data: {
                    enrollmentId: enrollment.id,
                    dayNumber: 1,
                    isLocked: false,
                    unlockedAt: new Date(),
                },
            })

            // Record the transaction
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    transactionType: 'course_purchase',
                    amount: enrollment.amountPaid,
                    paymentMethod: 'razorpay',
                    enrollmentId: enrollment.id,
                    gatewayTransactionId: razorpayPaymentId,
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
                            userId: user.id,
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
        })

        return createSuccessResponse({
            enrollmentId: enrollment.id,
            status: 'success',
            message: 'Payment verified and enrollment activated',
        })
    } catch (error) {
        console.error('[POST /api/enroll/verify-payment]', error)
        return serverError('Failed to verify payment')
    }
}
