import { redirect } from 'next/navigation';

/**
 * /login — The proxy.ts redirects unauthenticated users here from protected pages.
 * We bounce to the dashboard which shows the auth modal if not logged in.
 */
export default function LoginPage() {
    redirect('/dashboard');
}
