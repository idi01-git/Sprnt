import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, badRequest, notFound, serverError, HttpStatus, ErrorCode } from '@/lib/api-response'
import { adminGradeSubmissionSchema } from '@/lib/validations/admin'
import { logAdminAction } from '@/lib/admin-logger'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireReviewerOrAbove()
        const { submissionId } = await params

        const body = await request.json().catch(() => null)
        if (!body) return badRequest('Invalid JSON body')

        const parsed = adminGradeSubmissionSchema.safeParse(body)
        if (!parsed.success) {
            return badRequest('Validation failed', { errors: parsed.error.flatten().fieldErrors })
        }

        const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
        if (!submission) return notFound('Submission')

        const { metric1, metric2, metric3, metric4, metric5, adminNotes } = parsed.data

        // Weighted grading as per PRD:
        // - Simulation Accuracy: 25%
        // - Logic & Methodology: 25%
        // - Industrial Output: 20%
        // - Sensitivity Analysis: 15%
        // - Documentation: 15%
        const finalGrade = (
            metric1 * 0.25 +
            metric2 * 0.25 +
            metric3 * 0.20 +
            metric4 * 0.15 +
            metric5 * 0.15
        )

        let gradeCategory: 'Distinction' | 'First_Class' | 'Pass' | 'Fail'
        if (finalGrade >= 4.5) gradeCategory = 'Distinction'
        else if (finalGrade >= 3.0) gradeCategory = 'First_Class'
        else if (finalGrade >= 2.0) gradeCategory = 'Pass'
        else gradeCategory = 'Fail'

        const updated = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                metric1SimulationAccuracy: metric1,
                metric2LogicMethodology: metric2,
                metric3IndustrialOutput: metric3,
                metric4SensitivityAnalysis: metric4,
                metric5Documentation: metric5,
                finalGrade,
                gradeCategory,
                adminNotes,
            }
        })

        await logAdminAction(adminId, 'submission_graded_draft', 'submission', submissionId)

        return createSuccessResponse(updated)
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse(
                ErrorCode.ADMIN_AUTH_REQUIRED,
                'Admin authentication required',
                HttpStatus.UNAUTHORIZED
            )
        }
        console.error('[PUT /api/admin/submissions/[submissionId]/grade]', error)
        return serverError('Failed to grade submission')
    }
}
