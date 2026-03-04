import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createErrorResponse, ErrorCode, notFound, serverError, HttpStatus } from '@/lib/api-response'
import { logAdminAction } from '@/lib/admin-logger'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { adminId } = await requireAdminOrAbove()
        const { submissionId } = await params

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                enrollment: {
                    include: { course: true }
                },
                user: true,
            }
        })

        if (!submission) return notFound('Submission')

        const metricsComplete =
            submission.metric1SimulationAccuracy !== null &&
            submission.metric2LogicMethodology !== null &&
            submission.metric3IndustrialOutput !== null &&
            submission.metric4SensitivityAnalysis !== null &&
            submission.metric5Documentation !== null

        if (!metricsComplete || submission.finalGrade === null) {
            return createErrorResponse(
                ErrorCode.SUBMISSION_NOT_GRADED,
                'Submission must be fully graded before approval',
                HttpStatus.BAD_REQUEST
            )
        }

        if (Number(submission.finalGrade) < 3.0) {
            return createErrorResponse(
                ErrorCode.SUBMISSION_GRADE_TOO_LOW,
                'Final grade must be at least 3.0 to approve',
                HttpStatus.BAD_REQUEST
            )
        }

        const certId = `CERT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`

        const grade = Number(submission.finalGrade)
        let certGrade: 'Distinction' | 'First_Class' | 'Pass'
        if (grade >= 4.5) certGrade = 'Distinction'
        else if (grade >= 3.0) certGrade = 'First_Class'
        else certGrade = 'Pass'

        const identity = await prisma.identityVerification.findFirst({ where: { submissionId } })

        const [_, certificate] = await prisma.$transaction([
            // 1. Update submission status
            prisma.submission.update({
                where: { id: submissionId },
                data: { reviewStatus: 'approved', reviewCompletedAt: new Date() },
            }),

            // 2. Create certificate
            prisma.certificate.create({
                data: {
                    certificateId: certId,
                    enrollmentId: submission.enrollmentId,
                    userId: submission.userId,
                    courseId: submission.enrollment.courseId,
                    studentName: identity?.fullName ?? submission.user.name,
                    collegeName: identity?.collegeName ?? 'N/A',
                    courseName: submission.enrollment.course.courseName,
                    grade: certGrade,
                    certificateUrl: '', // Placeholder
                    qrCodeData: `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${certId}`,
                },
            }),

            // 3. Update enrollment
            prisma.enrollment.update({
                where: { id: submission.enrollmentId },
                data: { certificateIssued: true, certificateId: certId, completedAt: new Date() },
            }),

            // 4. Create notification
            prisma.notification.create({
                data: {
                    userId: submission.userId,
                    type: 'certificate_issued',
                    title: 'Certificate Issued! 🎉',
                    message: `Your certificate for ${submission.enrollment.course.courseName} has been issued.`,
                },
            }),
        ])

        await logAdminAction(adminId, 'submission_approved', 'submission', submissionId)

        return createSuccessResponse(certificate)
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[POST /api/admin/submissions/[submissionId]/approve]', error)
        return serverError()
    }
}
