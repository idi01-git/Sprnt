import { prisma } from '@/lib/db'
import { requireAdminOrAbove, AuthError } from '@/lib/auth/guards'
import { createSuccessResponse, createPaginatedResponse, badRequest, serverError, HttpStatus } from '@/lib/api-response'
import { adminCertificateListQuerySchema } from '@/lib/validations/admin'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        await requireAdminOrAbove()

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())
        const parsed = adminCertificateListQuerySchema.safeParse(queryParams)

        if (!parsed.success) {
            return badRequest('Invalid query parameters', { errors: parsed.error.flatten().fieldErrors })
        }

        const { search, status, courseId, page, limit, sort } = parsed.data
        const skip = (page - 1) * limit

        const where: Prisma.CertificateWhereInput = {}

        if (status === 'valid') {
            where.isRevoked = false
        } else if (status === 'revoked') {
            where.isRevoked = true
        }

        if (search) {
            where.OR = [
                { studentName: { contains: search, mode: 'insensitive' } },
                { courseName: { contains: search, mode: 'insensitive' } },
                { certificateId: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (courseId) {
            where.courseId = courseId
        }

        let orderBy: Prisma.CertificateOrderByWithRelationInput = { issuedAt: 'desc' }
        if (sort === 'oldest') {
            orderBy = { issuedAt: 'asc' }
        } else if (sort === 'name') {
            orderBy = { studentName: 'asc' }
        }

        const [certificates, total] = await Promise.all([
            prisma.certificate.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            prisma.certificate.count({ where }),
        ])

        return createPaginatedResponse(certificates, { total, page, pageSize: limit })
    } catch (error) {
        if (error instanceof AuthError) {
            return createSuccessResponse(null, HttpStatus.UNAUTHORIZED)
        }
        console.error('[GET /api/admin/certificates]', error)
        return serverError()
    }
}
