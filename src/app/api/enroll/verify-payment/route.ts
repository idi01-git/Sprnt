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

const REFERRAL_AMOUNT = 50

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

        // Get actual module count for this course to create correct number of dailyProgress records
        const courseWithModules = await prisma.course.findUnique({
            where: { id: enrollment!.courseId },
            select: { _count: { select: { modules: true } } },
        })
        const moduleCount = courseWithModules?._count.modules || 7

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

        // Update enrollment to success + create all 7 days progress + record transaction
        await prisma.$transaction(async (tx) => {
            // Mark enrollment as successful
            await tx.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    paymentStatus: 'success',
                    paymentGatewayPaymentId: razorpayPaymentId,
                },
            })

            // Initialize daily progress based on actual module count (Day 1 unlocked, rest locked)
            const records = Array.from({ length: moduleCount }, (_, i) => ({
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

            // Credit referral bonus to referrer if this user was referred
            const refereeUser = await tx.user.findUnique({
                where: { id: enrollment.userId },
                select: { referredBy: true, email: true },
            })

            console.info('[POST /api/enroll/verify-payment] Checking referral:', {
                userId: enrollment.userId,
                userEmail: refereeUser?.email,
                referredBy: refereeUser?.referredBy,
            })

            if (refereeUser?.referredBy) {
                // Check if referral already exists for this referee (idempotency)
                const existingReferral = await tx.referral.findFirst({
                    where: { refereeId: enrollment.userId },
                })

                if (existingReferral) {
                    console.info('[POST /api/enroll/verify-payment] Referral already exists, skipping:', existingReferral.id);
                } else {
                    // Get the referrer's referral code
                    const referrer = await tx.user.findUnique({
                        where: { id: refereeUser.referredBy },
                        select: { referralCode: true, email: true },
                    })

                    const referralCodeUsed = referrer?.referralCode || ''
                    const autoApproveAt = new Date()
                    autoApproveAt.setDate(autoApproveAt.getDate() + 7)

                    await tx.referral.create({
                        data: {
                            referrerId: refereeUser.referredBy,
                            refereeId: enrollment.userId,
                            referralCodeUsed,
                            status: 'pending',
                            amount: REFERRAL_AMOUNT,
                            autoApproveAt,
                        },
                    })

                    console.info('[POST /api/enroll/verify-payment] Referral credited:', {
                        referrerId: refereeUser.referredBy,
                        referrerEmail: referrer?.email,
                        refereeId: enrollment.userId,
                        refereeEmail: refereeUser?.email,
                        referralCodeUsed,
                        amount: REFERRAL_AMOUNT,
                    })
                }
            } else {
                console.info('[POST /api/enroll/verify-payment] No referral to credit - user has no referrer');
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
