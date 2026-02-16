import { PrismaClient, Prisma } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// =============================================================================
// PRISMA CLIENT SINGLETON (Prisma 7 + Driver Adapter)
// =============================================================================
// Prisma 7 with `provider = "prisma-client"` uses the client engine,
// which REQUIRES a driver adapter instead of the deprecated Rust engine.
// We use @prisma/adapter-pg for direct PostgreSQL connections.
//
// Environment variables:
//   DATABASE_URL         — prisma+postgres:// URL (used by Prisma CLI for migrations)
//   DIRECT_DATABASE_URL  — Raw postgres:// URL (used by PrismaPg adapter at runtime)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
    // Use DIRECT_DATABASE_URL for the adapter (raw postgres:// connection)
    // Falls back to DATABASE_URL for local development with prisma dev
    const connectionString =
        process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || ''

    const adapter = new PrismaPg({ connectionString })

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    } as ConstructorParameters<typeof PrismaClient>[0])
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

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
