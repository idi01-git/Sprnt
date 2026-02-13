import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AdminRole } from '@/generated/prisma/client'

// ============================================================================
// PROXY FUNCTION (Node.js Runtime)
// Next.js 16: middleware.ts is deprecated, use proxy.ts instead
// ============================================================================

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname

    // ============================================================================
    // PUBLIC ROUTES (Skip authentication)
    // ============================================================================
    const publicRoutes = [
        '/',
        '/about',
        '/courses',
        '/login',
        '/register',
        '/admin/login',
    ]

    const isPublicRoute =
        publicRoutes.includes(path) ||
        path.startsWith('/_next') ||
        path.startsWith('/api/public') ||
        path.match(/\.(ico|png|svg|jpg|jpeg|gif|webp)$/)

    if (isPublicRoute) {
        return NextResponse.next()
    }

    // ============================================================================
    // ADMIN ROUTES (Require admin authentication)
    // ============================================================================
    if (path.startsWith('/admin')) {
        return handleAdminAuth(request)
    }

    // ============================================================================
    // STUDENT ROUTES (Require student authentication)
    // ============================================================================
    if (
        path.startsWith('/dashboard') ||
        path.startsWith('/learn') ||
        path.startsWith('/profile') ||
        path.startsWith('/certificate')
    ) {
        return handleStudentAuth(request)
    }

    return NextResponse.next()
}

// ============================================================================
// ADMIN AUTHENTICATION HANDLER
// ============================================================================
async function handleAdminAuth(request: NextRequest) {
    // Import dynamically to avoid edge runtime issues
    const { prisma } = await import('@/lib/db')

    const path = request.nextUrl.pathname

    // Check for admin session cookie
    const adminSessionId = request.cookies.get('admin_session')?.value

    if (!adminSessionId) {
        // No session, redirect to admin login
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Validate admin session
    const adminSession = await prisma.adminSession.findUnique({
        where: { id: adminSessionId },
        include: { admin: true },
    })

    if (!adminSession || adminSession.expiresAt < new Date()) {
        // Session expired or invalid
        if (adminSession) {
            await prisma.adminSession.delete({ where: { id: adminSessionId } })
        }

        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('admin_session')
        return response
    }

    const admin = adminSession.admin

    // Check if admin is active
    if (!admin.isActive) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Role-based route restrictions
    const adminRole = admin.role as AdminRole

    if (path.startsWith('/admin/settings') && adminRole !== 'super_admin') {
        return NextResponse.json(
            { success: false, data: null, error: { code: 'AUTH_FORBIDDEN', message: 'SuperAdmin access required' } },
            { status: 403 },
        )
    }

    if (
        path.startsWith('/admin/users') &&
        adminRole !== 'super_admin' &&
        adminRole !== 'admin'
    ) {
        return NextResponse.json(
            { success: false, data: null, error: { code: 'AUTH_FORBIDDEN', message: 'Admin access required' } },
            { status: 403 },
        )
    }

    // Attach admin info to request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-id', admin.id)
    requestHeaders.set('x-admin-role', admin.role)
    requestHeaders.set('x-admin-email', admin.email)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

// ============================================================================
// STUDENT AUTHENTICATION HANDLER
// ============================================================================
async function handleStudentAuth(request: NextRequest) {
    // Import dynamically to avoid edge runtime issues
    const { prisma } = await import('@/lib/db')

    // Check for student session cookie
    const sessionId = request.cookies.get('sprintern_session')?.value

    if (!sessionId) {
        // No session, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Validate student session
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
        // Session expired or invalid
        if (session) {
            await prisma.session.delete({ where: { id: sessionId } })
        }

        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('sprintern_session')
        return response
    }

    const user = session.user

    // Check if user account is deleted
    if (user.deletedAt) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Attach user info to request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

// ============================================================================
// PROXY CONFIGURATION
// ============================================================================
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
