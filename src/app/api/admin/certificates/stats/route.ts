import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, serverError, HttpStatus } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const [totalIssued, validCount, revokedCount, distinctionCount, firstClassCount, passCount] = await Promise.all([
            prisma.certificate.count(),
            prisma.certificate.count({ where: { isRevoked: false } }),
            prisma.certificate.count({ where: { isRevoked: true } }),
            prisma.certificate.count({ where: { grade: 'Distinction', isRevoked: false } }),
            prisma.certificate.count({ where: { grade: 'First_Class', isRevoked: false } }),
            prisma.certificate.count({ where: { grade: 'Pass', isRevoked: false } }),
        ])

        return createSuccessResponse({
            totalIssued,
            validCount,
            revokedCount,
            grades: {
                distinction: distinctionCount,
                firstClass: firstClassCount,
                pass: passCount,
            }
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates/stats]', error)
        return serverError()
    }
}
