import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ enrollmentId: string; dayNumber: string }> }
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { enrollmentId, dayNumber: dayNumberStr } = await params
        const dayNumber = parseInt(dayNumberStr, 10)

        if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 7) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Day number must be between 1 and 7',
                HttpStatus.BAD_REQUEST
            )
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
            },
        })

        if (!enrollment) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_NOT_FOUND,
                'Enrollment not found',
                HttpStatus.NOT_FOUND
            )
        }

        if (enrollment.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Access denied',
                HttpStatus.FORBIDDEN
            )
        }

        if (enrollment.paymentStatus !== 'success') {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Payment not completed',
                HttpStatus.FORBIDDEN
            )
        }

        if (dayNumber > 1) {
            const progress = await prisma.dailyProgress.findUnique({
                where: {
                    enrollmentId_dayNumber: {
                        enrollmentId: enrollment.id,
                        dayNumber,
                    },
                },
                select: { isLocked: true },
            })

            if (!progress || progress.isLocked) {
                return createErrorResponse(
                    ErrorCode.ENROLLMENT_ACCESS_DENIED,
                    `Day ${dayNumber} is locked`,
                    HttpStatus.FORBIDDEN
                )
            }
        }

        const courseModule = await prisma.courseModule.findUnique({
            where: {
                courseId_dayNumber: {
                    courseId: enrollment.courseId,
                    dayNumber,
                },
            },
            select: { notesPdfUrl: true, title: true },
        })

        if (!courseModule) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                `Module not found for Day ${dayNumber}`,
                HttpStatus.NOT_FOUND
            )
        }

        if (!courseModule.notesPdfUrl) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                `Notes not available for Day ${dayNumber}`,
                HttpStatus.NOT_FOUND
            )
        }

        return createSuccessResponse({
            dayNumber,
            title: courseModule.title,
            notesUrl: courseModule.notesPdfUrl,
            isSecure: false,
        })
    } catch (error) {
        console.error('[GET /api/learn/[enrollmentId]/day/[dayNumber]/notes]', error)
        return serverError('Failed to fetch notes')
    }
}
