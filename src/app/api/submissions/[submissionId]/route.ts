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

/**
 * GET /api/submissions/{submissionId}
 * Get full submission detail with grading metrics and version history.
 * Auth: Session Cookie (owner only)
 */
export async function GET(
    _request: NextRequest,
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

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                enrollmentId: true,
                userId: true,
                projectFileUrl: true,
                reportPdfUrl: true,
                reviewStatus: true,
                metric1SimulationAccuracy: true,
                metric2LogicMethodology: true,
                metric3IndustrialOutput: true,
                metric4SensitivityAnalysis: true,
                metric5Documentation: true,
                finalGrade: true,
                gradeCategory: true,
                adminNotes: true,
                resubmissionCount: true,
                maxResubmissions: true,
                submittedAt: true,
                reviewStartedAt: true,
                reviewCompletedAt: true,
                enrollment: {
                    select: {
                        projectSubmissionDeadline: true,
                        course: {
                            select: {
                                courseName: true,
                                slug: true,
                            },
                        },
                    },
                },
                submissionVersions: {
                    select: {
                        id: true,
                        versionNumber: true,
                        projectFileUrl: true,
                        reportPdfUrl: true,
                        submittedAt: true,
                    },
                    orderBy: { versionNumber: 'desc' },
                },
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

        return createSuccessResponse({
            submission: {
                id: submission.id,
                enrollmentId: submission.enrollmentId,
                courseName: submission.enrollment.course.courseName,
                courseSlug: submission.enrollment.course.slug,
                projectFileUrl: submission.projectFileUrl,
                reportPdfUrl: submission.reportPdfUrl,
                reviewStatus: submission.reviewStatus,
                metrics: {
                    simulationAccuracy: submission.metric1SimulationAccuracy
                        ? Number(submission.metric1SimulationAccuracy) : null,
                    logicMethodology: submission.metric2LogicMethodology
                        ? Number(submission.metric2LogicMethodology) : null,
                    industrialOutput: submission.metric3IndustrialOutput
                        ? Number(submission.metric3IndustrialOutput) : null,
                    sensitivityAnalysis: submission.metric4SensitivityAnalysis
                        ? Number(submission.metric4SensitivityAnalysis) : null,
                    documentation: submission.metric5Documentation
                        ? Number(submission.metric5Documentation) : null,
                },
                finalGrade: submission.finalGrade
                    ? Number(submission.finalGrade) : null,
                gradeCategory: submission.gradeCategory,
                adminNotes: submission.adminNotes,
                resubmissionCount: submission.resubmissionCount,
                maxResubmissions: submission.maxResubmissions,
                canResubmit: submission.reviewStatus === 'rejected'
                    && submission.resubmissionCount < submission.maxResubmissions,
                deadline: submission.enrollment.projectSubmissionDeadline,
                submittedAt: submission.submittedAt,
                reviewStartedAt: submission.reviewStartedAt,
                reviewCompletedAt: submission.reviewCompletedAt,
                versions: submission.submissionVersions,
            },
        })
    } catch (error) {
        console.error('[GET /api/submissions/[submissionId]]', error)
        return serverError('Failed to fetch submission details')
    }
}
