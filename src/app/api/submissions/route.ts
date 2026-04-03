import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

const createSubmissionSchema = z.object({
    enrollmentId: z.string().min(1),
    driveLink: z.string().url(),
    fullName: z.string().min(1),
    dob: z.string().optional().nullable(),
    collegeName: z.string().min(1),
    collegeIdLink: z.string().url(),
    branch: z.string().min(1),
    graduationYear: z.number().int(),
})

/**
 * POST /api/submissions
 * Create a new project submission (or reject if one already exists).
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
        const result = createSubmissionSchema.safeParse(body)
        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { enrollmentId, driveLink, fullName, dob, collegeName, collegeIdLink, branch, graduationYear } = result.data

        // Verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                id: true,
                userId: true,
                paymentStatus: true,
                day7Completed: true,
                courseId: true,
            },
        })

        if (!enrollment || enrollment.userId !== user.id) {
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

        if (!enrollment.day7Completed) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Complete all 7 days before submitting',
                HttpStatus.FORBIDDEN
            )
        }

        // Check if submission already exists (enrollmentId is unique on Submission)
        const existing = await prisma.submission.findUnique({
            where: { enrollmentId },
            select: { id: true, reviewStatus: true },
        })

        if (existing) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                `A submission already exists (status: ${existing.reviewStatus}). Use the resubmit endpoint.`,
                HttpStatus.CONFLICT
            )
        }

        // Set project submission deadline (e.g., 14 days from now)
        const deadlineDays = 14
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + deadlineDays)

        // Create submission in a transaction
        const submission = await prisma.$transaction(async (tx) => {
            const sub = await tx.submission.create({
                data: {
                    enrollmentId,
                    userId: user.id,
                    driveLink,
                    fullName,
                    dob: dob || null,
                    collegeName,
                    collegeIdLink,
                    branch,
                    graduationYear,
                    reviewStatus: 'pending',
                },
                select: {
                    id: true,
                    enrollmentId: true,
                    reviewStatus: true,
                    submittedAt: true,
                },
            })

            // Set deadline on enrollment
            await tx.enrollment.update({
                where: { id: enrollmentId },
                data: { projectSubmissionDeadline: deadline },
            })

            return sub
        })

        return createSuccessResponse(
            {
                submission: {
                    id: submission.id,
                    enrollmentId: submission.enrollmentId,
                    reviewStatus: submission.reviewStatus,
                    submittedAt: submission.submittedAt,
                },
            },
            HttpStatus.CREATED
        )
    } catch (error) {
        console.error('[POST /api/submissions]', error)
        return serverError('Failed to create submission')
    }
}

/**
 * GET /api/submissions
 * List all submissions for current user.
 * Auth: Session Cookie
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return createErrorResponse(
                ErrorCode.AUTH_REQUIRED,
                'Authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
        const skip = (page - 1) * limit

        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    enrollmentId: true,
                    reviewStatus: true,
                    gradeCategory: true,
                    finalGrade: true,
                    resubmissionCount: true,
                    maxResubmissions: true,
                    submittedAt: true,
                    reviewCompletedAt: true,
                    enrollment: {
                        select: {
                            course: {
                                select: {
                                    courseName: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.submission.count({ where: { userId: user.id } }),
        ])

        const formattedSubmissions = submissions.map((s) => ({
            id: s.id,
            enrollmentId: s.enrollmentId,
            courseName: s.enrollment.course.courseName,
            courseSlug: s.enrollment.course.slug,
            reviewStatus: s.reviewStatus,
            gradeCategory: s.gradeCategory,
            finalGrade: s.finalGrade ? Number(s.finalGrade) : null,
            resubmissionCount: s.resubmissionCount,
            maxResubmissions: s.maxResubmissions,
            submittedAt: s.submittedAt.toISOString(),
            reviewCompletedAt: s.reviewCompletedAt?.toISOString() ?? null,
        }))

        return createPaginatedResponse(
            { submissions: formattedSubmissions },
            { total, page, pageSize: limit }
        )
    } catch (error) {
        console.error('[GET /api/submissions]', error)
        return serverError('Failed to fetch submissions')
    }
}
