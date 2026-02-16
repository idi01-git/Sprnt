import { cookies } from 'next/headers'
import { generateState, generateCodeVerifier } from 'arctic'
import { getGoogleOAuth } from '@/lib/auth/oauth'

/**
 * GET /login/google
 * Generate OAuth state + PKCE verifier, redirect to Google consent screen
 */
export async function GET() {
    try {
        const google = getGoogleOAuth()

        const state = generateState()
        const codeVerifier = generateCodeVerifier()
        const scopes = ['openid', 'profile', 'email']

        const url = google.createAuthorizationURL(state, codeVerifier, scopes)

        // Store state and code verifier in HttpOnly cookies (10 min expiry)
        const cookieStore = await cookies()

        cookieStore.set('google_oauth_state', state, {
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes
            sameSite: 'lax',
        })

        cookieStore.set('google_code_verifier', codeVerifier, {
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: 'lax',
        })

        return Response.redirect(url.toString())
    } catch (error) {
        console.error('[GET /login/google]', error)
        return Response.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=oauth_init_failed`
        )
    }
}
