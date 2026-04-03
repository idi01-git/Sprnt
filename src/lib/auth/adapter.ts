import type { Adapter, DatabaseSession, DatabaseUser, RegisteredDatabaseSessionAttributes } from 'lucia'
import { prisma } from '@/lib/db'

// ============================================================================
// CUSTOM PRISMA ADAPTER FOR LUCIA (Prisma 7 compatible)
// ============================================================================

/**
 * Custom Lucia adapter for Prisma 7.x
 * The official @lucia-auth/adapter-prisma only supports Prisma 4-5
 */
export class PrismaAdapter implements Adapter {
    private sessionModel: 'session' | 'adminSession'
    private userModel: 'user' | 'admin'

    constructor(sessionModel: 'session' | 'adminSession', userModel: 'user' | 'admin') {
        this.sessionModel = sessionModel
        this.userModel = userModel
    }

    async deleteSession(sessionId: string): Promise<void> {
        try {
            if (this.sessionModel === 'session') {
                await prisma.session.delete({
                    where: { id: sessionId },
                })
            } else {
                await prisma.adminSession.delete({
                    where: { id: sessionId },
                })
            }
        } catch {
            // Session might already be deleted
        }
    }

    async deleteUserSessions(userId: string): Promise<void> {
        if (this.sessionModel === 'session') {
            await prisma.session.deleteMany({
                where: { userId },
            })
        } else {
            await prisma.adminSession.deleteMany({
                where: { adminId: userId },
            })
        }
    }

    async getSessionAndUser(
        sessionId: string
    ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
        if (this.sessionModel === 'session') {
            const result = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { user: true },
            })

            if (!result) {
                return [null, null]
            }

            const { user, ...session } = result

            return [
                {
                    id: session.id,
                    userId: session.userId,
                    expiresAt: session.expiresAt,
                    attributes: {},
                },
                {
                    id: user.id,
                    attributes: {
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        emailVerified: user.emailVerified,
                        phone: user.phone,
                    },
                },
            ]
        } else {
            const result = await prisma.adminSession.findUnique({
                where: { id: sessionId },
                include: { admin: true },
            })

            if (!result) {
                return [null, null]
            }

            const { admin, ...session } = result

            return [
                {
                    id: session.id,
                    userId: session.adminId,
                    expiresAt: session.expiresAt,
                    attributes: {},
                },
                {
                    id: admin.id,
                    attributes: {
                        email: admin.email,
                        role: admin.role,
                        isActive: admin.isActive,
                    },
                },
            ]
        }
    }

    async getUserSessions(userId: string): Promise<DatabaseSession[]> {
        if (this.sessionModel === 'session') {
            const sessions = await prisma.session.findMany({
                where: { userId },
            })

            return sessions.map((session) => ({
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt,
                attributes: {},
            }))
        } else {
            const sessions = await prisma.adminSession.findMany({
                where: { adminId: userId },
            })

            return sessions.map((session) => ({
                id: session.id,
                userId: session.adminId,
                expiresAt: session.expiresAt,
                attributes: {},
            }))
        }
    }

    async setSession(session: DatabaseSession): Promise<void> {
        if (this.sessionModel === 'session') {
            await prisma.session.create({
                data: {
                    id: session.id,
                    userId: session.userId,
                    expiresAt: session.expiresAt,
                },
            })
        } else {
            await prisma.adminSession.create({
                data: {
                    id: session.id,
                    adminId: session.userId,
                    expiresAt: session.expiresAt,
                },
            })
        }
    }

    async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
        try {
            if (this.sessionModel === 'session') {
                await prisma.session.update({
                    where: { id: sessionId },
                    data: { expiresAt },
                })
            } else {
                await prisma.adminSession.update({
                    where: { id: sessionId },
                    data: { expiresAt },
                })
            }
        } catch {
            // Session might not exist
        }
    }

    async deleteExpiredSessions(): Promise<void> {
        const now = new Date()

        if (this.sessionModel === 'session') {
            await prisma.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            })
        } else {
            await prisma.adminSession.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            })
        }
    }
}

// ============================================================================
// ADAPTER INSTANCES
// ============================================================================

export const studentAdapter = new PrismaAdapter('session', 'user')
export const adminAdapter = new PrismaAdapter('adminSession', 'admin')
