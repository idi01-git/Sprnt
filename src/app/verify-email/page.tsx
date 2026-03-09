'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { CircleCheck, CircleX } from 'lucide-react';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link. Please use the link from your email.');
      return;
    }

    // Auto-verify on mount
    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setStatus('success');
          // Auto-redirect after 3 seconds
          setTimeout(() => router.push('/dashboard'), 3000);
        } else {
          const code = data?.error?.code ?? '';
          if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID') {
            setErrorMsg('This verification link has expired or already been used. Please request a new one.');
          } else {
            setErrorMsg(data?.error?.message ?? 'Verification failed. Please try again.');
          }
          setStatus('error');
        }
      } catch {
        setErrorMsg('Could not reach the server. Check your connection and try again.');
        setStatus('error');
      }
    };

    verify();
  }, [token, router]);

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setResendMsg('A new verification email has been sent! Please check your inbox.');
      } else {
        const code = data?.error?.code ?? '';
        if (code === 'RATE_LIMITED') {
          setResendMsg('Please wait 2 minutes before requesting another email.');
        } else if (code === 'AUTH_REQUIRED') {
          // Not logged in — redirect to dashboard login modal
          router.push('/dashboard');
        } else {
          setResendMsg(data?.error?.message ?? 'Failed to resend. Please try again.');
        }
      }
    } catch {
      setResendMsg('Could not reach the server. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  /* ─── Verifying State ─── */
  if (status === 'verifying') {
    return (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
          Verifying Your Email…
        </h2>
        <p className="text-gray-500 text-sm" style={poppins}>
          Please wait while we confirm your email address.
        </p>
      </div>
    );
  }

  /* ─── Success State ─── */
  if (status === 'success') {
    return (
      <div className="text-center space-y-4 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CircleCheck className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
          Email Verified! 🎉
        </h2>
        <p className="text-gray-500 text-sm" style={poppins}>
          Your email address has been successfully verified.
          Redirecting you to your dashboard in a moment…
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm transition-all hover:shadow-lg hover:scale-105"
          style={{ ...poppins, fontWeight: 600 }}
        >
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  /* ─── Error State ─── */
  return (
    <div className="text-center space-y-4 animate-fade-in-up">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <CircleX className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
        Verification Failed
      </h2>
      <p className="text-gray-500 text-sm" style={poppins}>{errorMsg}</p>

      {/* Resend Section */}
      <div className="pt-2">
        <p className="text-gray-400 text-xs mb-3" style={poppins}>
          Need a new verification link?
        </p>
        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ ...poppins, fontWeight: 600 }}
        >
          {resendLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="w-4 h-4" /> Resend Verification Email</>
          )}
        </button>

        {resendMsg && (
          <p
            className={`mt-3 text-sm ${resendMsg.includes('sent') ? 'text-green-600' : 'text-amber-600'}`}
            style={poppins}
          >
            {resendMsg}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Link href="/dashboard" className="text-purple-600 text-sm font-semibold hover:text-purple-700" style={poppins}>
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-16">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/images/mainlogo1-C1oyx5qb.png" alt="Sprintern" className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                EMAIL VERIFICATION
              </h1>
              <p className="text-gray-500 text-sm" style={poppins}>
                Confirming your identity
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                </div>
                <p className="text-gray-500 text-sm" style={poppins}>Loading…</p>
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6" style={poppins}>
          © 2026 Sprintern. All rights reserved.
        </p>
      </div>
    </div>
  );
}
