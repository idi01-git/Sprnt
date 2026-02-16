import { Google } from 'arctic'

// =============================================================================
// GOOGLE OAUTH CLIENT (Singleton)
// =============================================================================

let _google: Google | null = null

/**
 * Get or create the Google OAuth client
 */
export function getGoogleOAuth(): Google {
    if (_google) return _google

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectURI = `${process.env.NEXT_PUBLIC_APP_URL}/login/google/callback`

    if (!clientId || !clientSecret) {
        throw new Error(
            'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
        )
    }

    _google = new Google(clientId, clientSecret, redirectURI)
    return _google
}
