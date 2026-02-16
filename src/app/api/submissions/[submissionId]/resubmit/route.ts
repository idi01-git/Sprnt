import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { validateRequest } from '@/lib/auth/session'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

const resubmitSchema = z.object({
    projectFileUrl: z.string().url(),
    reportPdfUrl: z.string().url(),
})

/**
 * POST /api/submissions/{submissionId}/resubmit
 * Resubmit a rejected submission (if within resubmission limit).
 * Auth: Session Cookie (owner only)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
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

        const { submissionId } = await params
        const body = await request.json()
        const result = resubmitSchema.safeParse(body)

        if (!result.success) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid request body',
                HttpStatus.BAD_REQUEST,
                { errors: result.error.flatten().fieldErrors }
            )
        }

        const { projectFileUrl, reportPdfUrl } = result.data

        // Get submission
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                userId: true,
                enrollmentId: true,
                reviewStatus: true,
                resubmissionCount: true,
                maxResubmissions: true,
            },
        })

        if (!submission) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Submission not found',
                HttpStatus.NOT_FOUND
            )
        }

        if (submission.userId !== user.id) {
            return createErrorResponse(
                ErrorCode.ENROLLMENT_ACCESS_DENIED,
                'Access denied',
                HttpStatus.FORBIDDEN
            )
        }

        if (submission.reviewStatus !== 'rejected') {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                `Cannot resubmit: current status is '${submission.reviewStatus}'`,
                HttpStatus.BAD_REQUEST
            )
        }

        if (submission.resubmissionCount >= submission.maxResubmissions) {
            return createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                `Maximum resubmission limit (${submission.maxResubmissions}) reached`,
                HttpStatus.BAD_REQUEST
            )
        }

        // Update submission and create new version in transaction
        const updated = await prisma.$transaction(async (tx) => {
            const newVersionNumber = submission.resubmissionCount + 2 // version 1 is original

            // Create new version
            await tx.submissionVersion.create({
                data: {
                    submissionId: submission.id,
                    versionNumber: newVersionNumber,
                    projectFileUrl,
                    reportPdfUrl,
                },
            })

            // Update submission
            return tx.submission.update({
                where: { id: submission.id },
                data: {
                    projectFileUrl,
                    reportPdfUrl,
                    reviewStatus: 'pending',
                    resubmissionCount: { increment: 1 },
                    submittedAt: new Date(),
                    // Reset review fields
                    reviewStartedAt: null,
                    reviewCompletedAt: null,
                    adminNotes: null,
                },
                select: {
                    id: true,
                    reviewStatus: true,
                    resubmissionCount: true,
                    maxResubmissions: true,
                    submittedAt: true,
                },
            })
        })

        return createSuccessResponse({
            submission: {
                id: updated.id,
                reviewStatus: updated.reviewStatus,
                resubmissionCount: updated.resubmissionCount,
                maxResubmissions: updated.maxResubmissions,
                submittedAt: updated.submittedAt,
                canResubmit: updated.resubmissionCount < updated.maxResubmissions,
            },
        })
    } catch (error) {
        console.error('[POST /api/submissions/[submissionId]/resubmit]', error)
        return serverError('Failed to resubmit')
    }
}
