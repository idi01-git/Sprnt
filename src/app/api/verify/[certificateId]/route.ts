import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    HttpStatus,
    ErrorCode,
} from '@/lib/api-response'

/**
 * GET /api/verify/{certificateId}
 * Public endpoint: Verify a certificate by its ID (from QR scan).
 * No auth required — this is public-facing.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ certificateId: string }> }
) {
    try {
        const { certificateId } = await params

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            select: {
                certificateId: true,
                studentName: true,
                collegeName: true,
                courseName: true,
                grade: true,
                isRevoked: true,
                revokedAt: true,
                issuedAt: true,
                course: {
                    select: {
                        affiliatedBranch: true,
                    },
                },
            },
        })

        if (!certificate) {
            return createErrorResponse(
                ErrorCode.NOT_FOUND,
                'Certificate not found. This certificate ID does not exist.',
                HttpStatus.NOT_FOUND
            )
        }

        // Log this verification scan
        const ip = request.headers.get('x-forwarded-for')
            ?? request.headers.get('x-real-ip')
            ?? 'unknown'
        const userAgent = request.headers.get('user-agent') ?? null

        await prisma.certificateVerification.create({
            data: {
                certificateId: certificate.certificateId,
                ipAddress: ip.split(',')[0].trim(),
                userAgent,
            },
        }).catch(() => {
            // Non-critical — don't fail the verification if logging fails
        })

        return createSuccessResponse({
            valid: !certificate.isRevoked,
            certificate: {
                certificateId: certificate.certificateId,
                studentName: certificate.studentName,
                collegeName: certificate.collegeName,
                courseName: certificate.courseName,
                branch: certificate.course.affiliatedBranch,
                grade: certificate.grade,
                issuedAt: certificate.issuedAt,
                isRevoked: certificate.isRevoked,
                revokedAt: certificate.revokedAt,
            },
        })
    } catch (error) {
        console.error('[GET /api/verify/[certificateId]]', error)
        return serverError('Failed to verify certificate')
    }
}
