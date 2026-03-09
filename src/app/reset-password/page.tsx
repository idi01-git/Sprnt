'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { CircleCheck, CircleX } from 'lucide-react';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const inputClass =
  'w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One number', ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-1.5 text-xs" style={poppins}>
          {c.ok ? (
            <CircleCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
          ) : (
            <CircleX className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span className={c.ok ? 'text-green-600' : 'text-gray-400'}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // If no token in URL, show error immediately
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const isValidPassword =
    password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isValidPassword) {
      setErrorMsg('Password does not meet the requirements.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('success');
        // Auto-redirect to dashboard after 2.5s (already logged in via auto-session)
        setTimeout(() => router.push('/dashboard'), 2500);
      } else {
        const code = data?.error?.code ?? '';
        const msg = data?.error?.message ?? 'Something went wrong.';
        if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID') {
          setErrorMsg('This reset link has expired or already been used. Please request a new one.');
        } else {
          setErrorMsg(msg);
        }
        setStatus('error');
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
      setStatus('error');
    }
  };

  /* ─── Success State ─── */
  if (status === 'success') {
    return (
      <div className="text-center space-y-4 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CircleCheck className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
          Password Updated!
        </h2>
        <p className="text-gray-500 text-sm" style={poppins}>
          Your password has been reset successfully. You&apos;re now logged in.
          Redirecting to your dashboard…
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

  /* ─── Token-less / Error-only State ─── */
  if (status === 'error' && !token) {
    return (
      <div className="text-center space-y-4 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <CircleX className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
          Invalid Link
        </h2>
        <p className="text-gray-500 text-sm" style={poppins}>{errorMsg}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm transition-all hover:shadow-lg hover:scale-105"
          style={{ ...poppins, fontWeight: 600 }}
        >
          Back to Login
        </Link>
      </div>
    );
  }

  /* ─── Form State ─── */
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* New Password */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-700" style={{ ...poppins, fontWeight: 600 }}>
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === 'loading'}
            required
            className={inputClass + ' pl-10'}
            style={{ ...poppins, fontSize: '14px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-700" style={{ ...poppins, fontWeight: 600 }}>
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={status === 'loading'}
            required
            className={
              inputClass +
              ' pl-10 ' +
              (confirm && confirm !== password ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '')
            }
            style={{ ...poppins, fontSize: '14px' }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {confirm && confirm !== password && (
          <p className="text-red-500 text-xs mt-1" style={poppins}>
            Passwords do not match
          </p>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-red-600 text-sm" style={poppins}>{errorMsg}</p>
          {status === 'error' && (
            <Link href="/dashboard" className="text-purple-600 text-sm font-semibold mt-1 inline-block" style={poppins}>
              Request new reset link →
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !isValidPassword || password !== confirm}
        className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ ...poppins, fontWeight: 600 }}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            RESETTING…
          </>
        ) : (
          'RESET PASSWORD'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-16">
      {/* Subtle background blobs */}
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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                RESET PASSWORD
              </h1>
              <p className="text-gray-500 text-sm" style={poppins}>
                Set a new password for your account
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6" style={poppins}>
          © 2026 Sprintern. All rights reserved.
        </p>
      </div>
    </div>
  );
}
