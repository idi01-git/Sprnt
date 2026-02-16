import { cookies } from 'next/headers'
import { OAuth2RequestError, ArcticFetchError } from 'arctic'
import { getGoogleOAuth } from '@/lib/auth/oauth'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'

interface GoogleUser {
    sub: string      // Google user ID
    email: string
    email_verified: boolean
    name: string
    picture?: string
}

/**
 * GET /login/google/callback
 * Validate state, exchange code for tokens, fetch Google profile,
 * create/link user, create session
 */
export async function GET(request: Request) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    try {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')

        const cookieStore = await cookies()
        const storedState = cookieStore.get('google_oauth_state')?.value
        const storedCodeVerifier = cookieStore.get('google_code_verifier')?.value

        // Validate OAuth state and params
        if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
            return Response.redirect(`${appUrl}/login?error=oauth_invalid_state`)
        }

        // Exchange authorization code for tokens
        const google = getGoogleOAuth()
        const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier)
        const accessToken = tokens.accessToken()

        // Fetch Google user profile
        const googleUserResponse = await fetch(
            'https://openidconnect.googleapis.com/v1/userinfo',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (!googleUserResponse.ok) {
            return Response.redirect(`${appUrl}/login?error=oauth_profile_failed`)
        }

        const googleUser: GoogleUser = await googleUserResponse.json()

        // Check if OAuth account already exists
        const existingOAuth = await prisma.oAuthAccount.findUnique({
            where: {
                providerId_providerUserId: {
                    providerId: 'google',
                    providerUserId: googleUser.sub,
                },
            },
            select: { userId: true },
        })

        if (existingOAuth) {
            // Existing user — create session and redirect
            await createSession(existingOAuth.userId)

            // Clear OAuth cookies
            cookieStore.delete('google_oauth_state')
            cookieStore.delete('google_code_verifier')

            return Response.redirect(`${appUrl}/dashboard`)
        }

        // Check if a user with this email already exists (link account)
        const existingUser = await prisma.user.findUnique({
            where: { email: googleUser.email.toLowerCase() },
            select: { id: true },
        })

        if (existingUser) {
            // Link Google account to existing user
            await prisma.oAuthAccount.create({
                data: {
                    providerId: 'google',
                    providerUserId: googleUser.sub,
                    userId: existingUser.id,
                    email: googleUser.email.toLowerCase(),
                },
            })

            // Set emailVerified since Google verified the email
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    emailVerified: true,
                    avatarUrl: googleUser.picture || undefined,
                },
            })

            await createSession(existingUser.id)

            // Clear OAuth cookies
            cookieStore.delete('google_oauth_state')
            cookieStore.delete('google_code_verifier')

            return Response.redirect(`${appUrl}/dashboard`)
        }

        // New user — create user + OAuth account in a transaction
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: googleUser.email.toLowerCase(),
                    name: googleUser.name,
                    emailVerified: true, // Google verified
                    avatarUrl: googleUser.picture || null,
                },
            })

            await tx.oAuthAccount.create({
                data: {
                    providerId: 'google',
                    providerUserId: googleUser.sub,
                    userId: user.id,
                    email: googleUser.email.toLowerCase(),
                },
            })

            return user
        })

        await createSession(newUser.id)

        // Clear OAuth cookies
        cookieStore.delete('google_oauth_state')
        cookieStore.delete('google_code_verifier')

        return Response.redirect(`${appUrl}/dashboard`)
    } catch (error) {
        // Clear cookies on error
        try {
            const cookieStore = await cookies()
            cookieStore.delete('google_oauth_state')
            cookieStore.delete('google_code_verifier')
        } catch { /* ignore cookie cleanup errors */ }

        if (error instanceof OAuth2RequestError) {
            console.error('[Google OAuth] Request error:', error.code)
            return Response.redirect(`${appUrl}/login?error=oauth_denied`)
        }

        if (error instanceof ArcticFetchError) {
            console.error('[Google OAuth] Fetch error:', error.cause)
            return Response.redirect(`${appUrl}/login?error=oauth_network_error`)
        }

        console.error('[GET /login/google/callback]', error)
        return Response.redirect(`${appUrl}/login?error=oauth_failed`)
    }
}
