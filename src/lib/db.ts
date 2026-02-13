import { PrismaClient, Prisma } from '@/generated/prisma/client'

// PrismaClient singleton for Next.js
// Prevents multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Prisma 7: `as any` bypasses strict `Subset<T, PrismaClientOptions>` validation
// which incorrectly requires `accelerateUrl` when using `log`. Runtime config is valid.
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    } as any)

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Graceful shutdown (Safe in Node.js runtime used by proxy.ts)
if (typeof window === 'undefined') {
    process.on('beforeExit', async () => {
        await prisma.$disconnect()
    })
}

// ============================================================================
// TYPE EXPORTS (For better DX)
// ============================================================================

export type {
    PrismaClient,
    Prisma,
    User,
    Admin,
    Session,
    AdminSession,
    Course,
    Submission,
    Certificate,
} from '@/generated/prisma/client'
