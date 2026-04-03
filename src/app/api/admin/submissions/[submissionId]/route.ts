import { prisma } from '@/lib/db'
import { requireReviewerOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, notFound, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        await requireReviewerOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                enrollment: {
                    include: {
                        course: { select: { id: true, courseName: true, courseId: true, affiliatedBranch: true } }
                    }
                },
                assignedAdmin: { select: { email: true } },
            },
        })

        if (!submission) {
            return notFound('Submission')
        }

        return createSuccessResponse({
            id: submission.id,
            enrollment: {
                id: submission.enrollment.id,
                user: { id: submission.user.id, name: submission.user.name, email: submission.user.email },
                course: { id: submission.enrollment.course.id, courseName: submission.enrollment.course.courseName },
            },
            identity: submission.fullName ? {
                fullName: submission.fullName,
                collegeName: submission.collegeName,
                branch: submission.branch,
                graduationYear: submission.graduationYear,
                collegeIdUrl: submission.collegeIdLink || null,
            } : null,
            projectFileUrl: submission.driveLink || null,
            reportPdfUrl: null,
            reviewStatus: submission.reviewStatus,
            gradeMetrics: (submission.metric1SimulationAccuracy || submission.metric2LogicMethodology) ? {
                simulationAccuracy: Number(submission.metric1SimulationAccuracy || 0),
                logicMethodology: Number(submission.metric2LogicMethodology || 0),
                industrialOutput: Number(submission.metric3IndustrialOutput || 0),
                sensitivityAnalysis: Number(submission.metric4SensitivityAnalysis || 0),
                documentation: Number(submission.metric5Documentation || 0),
            } : null,
            finalGrade: submission.finalGrade ? Number(submission.finalGrade) : null,
            gradeCategory: submission.gradeCategory || null,
            adminNotes: submission.adminNotes || null,
            submittedAt: submission.submittedAt.toISOString(),
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createErrorResponse('ADMIN_AUTH_REQUIRED', 'Admin authentication required', HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/submissions/[submissionId]]', error)
        return serverError()
    }
}
