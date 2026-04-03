import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { createOrderSchema } from '@/lib/validations/enrollment'
import { createOrder, PaymentError } from '@/lib/payments'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/enroll/create-order
 * Create Razorpay order with course price (minus discount if promocode valid).
 * Return order_id, amount, key_id.
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
        const result = createOrderSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { courseId, promocode: promoCode } = result.data

        // Verify course exists and is active
        const course = await prisma.course.findFirst({
            where: { courseId: courseId, isActive: true, deletedAt: null },
            select: { id: true, courseId: true, courseName: true, coursePrice: true },
        })

        // Fetch fresh user data for Razorpay prefill
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true, email: true, phone: true },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                'Course not found',
                HttpStatus.NOT_FOUND
            )
        }

        // Check if user is already enrolled (with successful payment)
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: course.id,
                },
            },
            select: { id: true, paymentStatus: true },
        })

        if (existingEnrollment?.paymentStatus === 'success') {
            return createErrorResponse(
                ErrorCode.COURSE_ALREADY_ENROLLED,
                'You are already enrolled in this course',
                HttpStatus.CONFLICT
            )
        }

        const coursePrice = Number(course.coursePrice)
        let discountAmount = 0
        let promocodeUsed: string | null = null

        console.info('[POST /api/enroll/create-order]', {
            courseId,
            promoCode,
            coursePrice,
        })

        // Validate promocode if provided
        if (promoCode) {
            console.info('[POST /api/enroll/create-order] Promo code received, looking up:', promoCode);
            const promo = await prisma.promocode.findUnique({
                where: { code: promoCode },
                select: {
                    id: true,
                    code: true,
                    discountType: true,
                    discountValue: true,
                    maxDiscount: true,
                    usageLimit: true,
                    usageCount: true,
                    perUserLimit: true,
                    validFrom: true,
                    validUntil: true,
                    isActive: true,
                    deletedAt: true,
                },
            })

            const now = new Date()

            if (
                promo &&
                promo.isActive &&
                !promo.deletedAt &&
                now >= promo.validFrom &&
                now <= promo.validUntil
            ) {
                // Check usage limits
                const globalOk = promo.usageLimit === null || promo.usageCount < promo.usageLimit
                const userUsageCount = await prisma.promocodeUsage.count({
                    where: { promocodeId: promo.id, userId: user.id },
                })
                const perUserOk = userUsageCount < promo.perUserLimit

                if (globalOk && perUserOk) {
                    if (promo.discountType === 'percentage') {
                        discountAmount = Math.round((coursePrice * Number(promo.discountValue)) / 100)
                        if (promo.maxDiscount !== null) {
                            discountAmount = Math.min(discountAmount, Number(promo.maxDiscount))
                        }
                    } else {
                        discountAmount = Number(promo.discountValue)
                    }
                    discountAmount = Math.min(discountAmount, coursePrice)
                    promocodeUsed = promo.code
                }
            }
        }

        const finalAmount = coursePrice - discountAmount

        console.info('[POST /api/enroll/create-order] Final calculation', {
            coursePrice,
            discountAmount,
            finalAmount,
            promoCode,
        })

        // Create or reuse pending enrollment
        const enrollment = existingEnrollment
            ? await prisma.enrollment.update({
                where: { id: existingEnrollment.id },
                data: {
                    amountPaid: finalAmount,
                    discountAmount,
                    promocodeUsed,
                    paymentStatus: 'pending',
                },
                select: { id: true },
            })
            : await prisma.enrollment.create({
                data: {
                    userId: user.id,
                    courseId: course.id,
                    amountPaid: finalAmount,
                    discountAmount,
                    promocodeUsed,
                    paymentStatus: 'pending',
                },
                select: { id: true },
            })

        // Create Razorpay order
        console.info('[POST /api/enroll/create-order] Creating Razorpay order with:', {
            finalAmount,
            amountInPaise: Math.round(finalAmount * 100),
        });
        const receipt = `enroll_${enrollment.id}`
        const order = await createOrder({
            amountInr: finalAmount,
            receipt,
            notes: {
                enrollmentId: enrollment.id,
                userId: user.id,
                courseId: course.id,
                courseName: course.courseName,
            },
        })

        // Store the order ID on the enrollment
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { paymentGatewayOrderId: order.id },
        })

        return createSuccessResponse({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID!,
            enrollmentId: enrollment.id,
            courseName: course.courseName,
            originalPrice: coursePrice,
            discountAmount,
            finalAmount,
            // User data for Razorpay prefill
            userName: fullUser?.name ?? null,
            userEmail: fullUser?.email ?? null,
            userPhone: fullUser?.phone ?? null,
        }, HttpStatus.CREATED)
    } catch (error) {
        if (error instanceof PaymentError) {
            console.error('[POST /api/enroll/create-order] PaymentError:', error.message)
            return createErrorResponse(
                error.code,
                error.message,
                error.statusCode as 400 | 500,
            )
        }
        console.error('[POST /api/enroll/create-order]', error)
        return serverError('Failed to create order')
    }
}
