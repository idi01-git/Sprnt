import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import { validatePromocodeSchema } from '@/lib/validations/enrollment'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * POST /api/promocode/validate
 * Validate promocode: check active, date range, usage limits, per-user limit.
 * Return discount amount.
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
        const result = validatePromocodeSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { code, courseId } = result.data

        // Verify course exists and is active
        const course = await prisma.course.findFirst({
            where: { courseId: courseId, isActive: true, deletedAt: null },
            select: { id: true, coursePrice: true },
        })

        if (!course) {
            return createErrorResponse(
                ErrorCode.COURSE_NOT_FOUND,
                'Course not found',
                HttpStatus.NOT_FOUND
            )
        }

        // Find promocode
        const promocode = await prisma.promocode.findUnique({
            where: { code },
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

        if (!promocode || !promocode.isActive || promocode.deletedAt) {
            return createErrorResponse(
                ErrorCode.PROMO_INVALID,
                'Invalid or inactive promocode',
                HttpStatus.BAD_REQUEST
            )
        }

        // Check date range
        const now = new Date()
        if (now < promocode.validFrom || now > promocode.validUntil) {
            return createErrorResponse(
                ErrorCode.PROMO_EXPIRED,
                'Promocode has expired or is not yet valid',
                HttpStatus.BAD_REQUEST
            )
        }

        // Check global usage limit
        if (promocode.usageLimit !== null && promocode.usageCount >= promocode.usageLimit) {
            return createErrorResponse(
                ErrorCode.PROMO_USAGE_EXCEEDED,
                'Promocode usage limit has been reached',
                HttpStatus.BAD_REQUEST
            )
        }

        // Check per-user usage limit
        const userUsageCount = await prisma.promocodeUsage.count({
            where: {
                promocodeId: promocode.id,
                userId: user.id,
            },
        })

        if (userUsageCount >= promocode.perUserLimit) {
            return createErrorResponse(
                ErrorCode.PROMO_USAGE_EXCEEDED,
                'You have already used this promocode the maximum number of times',
                HttpStatus.BAD_REQUEST
            )
        }

        // Calculate discount
        const coursePrice = Number(course.coursePrice)
        let discountAmount: number

        if (promocode.discountType === 'percentage') {
            discountAmount = Math.round((coursePrice * Number(promocode.discountValue)) / 100)
            // Cap at maxDiscount if set
            if (promocode.maxDiscount !== null) {
                discountAmount = Math.min(discountAmount, Number(promocode.maxDiscount))
            }
        } else {
            // Fixed discount
            discountAmount = Number(promocode.discountValue)
        }

        // Don't exceed course price
        discountAmount = Math.min(discountAmount, coursePrice)

        const finalAmount = coursePrice - discountAmount

        return createSuccessResponse({
            valid: true,
            code: promocode.code,
            discountType: promocode.discountType,
            discountValue: Number(promocode.discountValue),
            discountAmount,
            originalPrice: coursePrice,
            finalAmount,
        })
    } catch (error) {
        console.error('[POST /api/promocode/validate]', error)
        return serverError('Failed to validate promocode')
    }
}
