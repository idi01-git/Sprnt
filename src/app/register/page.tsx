'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Lock, Phone, Calendar,
  Eye, EyeOff, Loader2, Sparkles
} from 'lucide-react';
import { CircleCheck } from 'lucide-react';
import {
  getFirebaseAuth,
  getGoogleProvider,
} from '@/lib/firebase-client';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const inputBase =
  'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400';

const STUDY_LEVEL_OPTIONS = [
  { value: 'NINTH', label: '9th Grade' },
  { value: 'TENTH', label: '10th Grade' },
  { value: 'ELEVENTH', label: '11th Grade' },
  { value: 'TWELFTH', label: '12th Grade' },
  { value: 'COLLEGE_1', label: 'College 1st Year' },
  { value: 'COLLEGE_2', label: 'College 2nd Year' },
  { value: 'COLLEGE_3', label: 'College 3rd Year' },
  { value: 'COLLEGE_4', label: 'College 4th Year' },
  { value: 'GRADUATED', label: 'Graduated' },
];

interface FieldErrors {
  email?: string[];
  password?: string[];
  name?: string[];
  phone?: string[];
  dob?: string[];
  studyLevel?: string[];
  referralCode?: string[];
}

function parseApiError(data: any, httpStatus: number): { message: string; fields: FieldErrors } {
  const code: string = data?.error?.code ?? '';
  const message: string = data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.';
  const details = data?.error?.details ?? data?.details ?? {};
  const fieldErrors: FieldErrors = details?.errors ?? {};

  const friendlyMessages: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
    AUTH_EMAIL_EXISTS: 'An account with this email already exists.',
    AUTH_PHONE_EXISTS: 'An account with this phone number already exists.',
    AUTH_ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
    RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
    VALIDATION_ERROR: httpStatus === 409 ? 'An account with this email already exists.' : message,
  };

  return { message: friendlyMessages[code] ?? message, fields: fieldErrors };
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.join(' ')}</p>;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get redirect URL from query params, default to dashboard
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  
  // Get referral code from URL if present
  const urlReferralCode = searchParams.get('ref') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [referralCode, setReferralCode] = useState(urlReferralCode);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = { name, email, password };
      if (phone.trim()) body.phone = phone.trim();
      if (dob) body.dob = dob;
      if (studyLevel) body.studyLevel = studyLevel;
      if (referralCode.trim()) body.referralCode = referralCode.trim();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(redirectUrl), 2000);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setFieldErrors(parsed.fields);
        setIsLoading(false);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth()
      const provider = getGoogleProvider()
      const result = await import('firebase/auth').then(m => m.signInWithPopup(auth, provider))
      const idToken = await result.user.getIdToken()

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, referralCode: referralCode.trim() || undefined }),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        router.push(redirectUrl)
      } else {
        const parsed = parseApiError(data, res.status)
        setError(parsed.message)
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
      if (message.includes('popup-closed-by-user') || message.includes('Firebase: Error (auth/popup-closed-by-user)')) {
        setError('')
        setIsLoading(false)
        return
      }
      setError(message)
      setIsLoading(false)
    }
  };

  /* ─── Success State ─── */
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CircleCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            Account Created! 🎉
          </h2>
          <p className="text-gray-500 text-sm" style={poppins}>
            Welcome to Sprintern! Check your inbox for a verification email.<br />
            Redirecting to your dashboard…
          </p>
          <Link
            href={redirectUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold transition-all hover:shadow-lg"
            style={poppins}
          >
            Continue →
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Form ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-start justify-center px-4 py-10">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/images/mainlogo1-C1oyx5qb.png" alt="Sprintern" className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full" style={poppins}>
                FREE TRIAL
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
              CREATE ACCOUNT
            </h1>
            <p className="text-gray-500 text-sm mt-1" style={poppins}>
              Join 500+ core engineers mastering industry tools in 14 days.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-95 mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ ...poppins, fontSize: '15px' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium tracking-wider" style={poppins}>OR EMAIL</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className={inputBase + ' pr-10'}
                  style={{ ...poppins, fontSize: '14px' }}
                  required
                />
                <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <FieldError errors={fieldErrors.name} />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={inputBase + ' pr-10'}
                  style={{ ...poppins, fontSize: '14px' }}
                  required
                />
                <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <FieldError errors={fieldErrors.email} />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={inputBase + ' pr-10'}
                  style={{ ...poppins, fontSize: '14px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <FieldError errors={fieldErrors.password} />
            </div>

            {/* Phone (Optional) */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Phone <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className={inputBase + ' pr-10'}
                  style={{ ...poppins, fontSize: '14px' }}
                />
                <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <FieldError errors={fieldErrors.phone} />
            </div>

            {/* DOB (Optional) */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Date of Birth <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={isLoading}
                  className={inputBase + ' pr-10'}
                  style={{ ...poppins, fontSize: '14px' }}
                />
                <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <FieldError errors={fieldErrors.dob} />
            </div>

            {/* Study Level */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Study Level <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                disabled={isLoading}
                className={`${inputBase} appearance-none`}
                style={{ ...poppins, fontSize: '14px' }}
              >
                <option value="">Select your level</option>
                {STUDY_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Referral Code */}
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 font-semibold" style={poppins}>
                Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="FRIEND2025"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className={inputBase}
                style={{ ...poppins, fontSize: '14px', letterSpacing: '0.05em' }}
              />
              <FieldError errors={fieldErrors.referralCode} />
            </div>

            {/* Error / Success messages */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm" style={poppins}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ ...poppins, fontWeight: 600, fontSize: '15px' }}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> CREATING ACCOUNT…</>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>

            {/* Link to login */}
            <p className="text-center text-gray-600 text-sm pt-1" style={poppins}>
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                LOGIN
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6" style={poppins}>
          © 2026 Sprintern. All rights reserved.{' '}
          <Link href="/dashboard" className="hover:text-purple-500 transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
