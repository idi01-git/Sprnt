'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Wallet,
  Users,
  Bell,
  Award,
  ChevronDown,
  LogOut,
  X,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  FileCheck
} from 'lucide-react';

interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

interface FieldErrors {
  email?: string[];
  password?: string[];
  name?: string[];
  phone?: string[];
  dob?: string[];
  studyLevel?: string[];
  referralCode?: string[];
}

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

const inputClass = 'w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400';
const inputStyle: React.CSSProperties = { fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '14px', color: '#1f2937' };
const labelStyle: React.CSSProperties = { fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#374151' };
const btnStyle: React.CSSProperties = { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '15px' };

type View = 'login' | 'signup' | 'forgot';

function parseApiError(data: any, httpStatus: number): { message: string; fields: FieldErrors } {
  const code: string = data?.error?.code ?? '';
  const message: string = data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.';
  const details = data?.error?.details ?? data?.details ?? {};
  const fieldErrors: FieldErrors = details?.errors ?? {};

  const friendlyMessages: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    AUTH_EMAIL_EXISTS: 'An account with this email already exists.',
    AUTH_PHONE_EXISTS: 'An account with this phone number already exists.',
    AUTH_ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
    AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again shortly.',
    VALIDATION_ERROR: httpStatus === 409 ? 'An account with this email already exists.' : message,
  };

  return { message: friendlyMessages[code] ?? message, fields: fieldErrors };
}

function DashboardNavbar({ user, onLogout, onShowAuth, unreadCount }: { user: AuthedUser | null; onLogout: () => void; onShowAuth: (view: View) => void; unreadCount?: number }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { href: '/dashboard', icon: BookOpen, label: 'My Courses' },
    { href: '/dashboard/submit', icon: FileCheck, label: 'Submissions' },
    { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
    { href: '/dashboard/referrals', icon: Users, label: 'Refer & Earn' },
    { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg shadow-purple-500/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
            <img src="/images/mainlogo1-C1oyx5qb.png" alt="Logo" className="h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '14px' }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-purple-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-gray-700 group-hover:text-purple-600 transition-colors text-sm max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-scale-up origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {user.email}
                      </p>
                      {!user.emailVerified && (
                        <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Email not verified
                        </span>
                      )}
                    </div>
                    {!user.emailVerified && (
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          try {
                            const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok) {
                              alert("Verification email sent! Please check your inbox.");
                            } else {
                              alert(data.error?.message || "Failed to send verification email.");
                            }
                          } catch {
                            alert("Something went wrong.");
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <Mail className="w-4 h-4" />
                        Verify Email
                      </button>
                    )}
                    <Link
                      href="/dashboard/certificates"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <Award className="w-4 h-4" />
                      My Certificates
                    </Link>
                    <Link
                      href="/dashboard/submit"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <FileCheck className="w-4 h-4" />
                      My Submissions
                    </Link>
                    <div className="border-t border-gray-100 mt-1" />
                    <Link href="/" onClick={(e) => { e.preventDefault(); setUserMenuOpen(false); onLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onShowAuth('login')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-105"
                style={{ ...btnStyle, fontSize: '14px' }}
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AuthModal({ show, onClose, view, setView, onLogin }: { show: boolean; onClose: () => void; view: View; setView: (v: View) => void; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setDob(''); setStudyLevel(''); setReferralCode('');
    setError(''); setFieldErrors({}); setSuccessMessage(''); setIsLoading(false);
  };

  useEffect(() => {
    if (show) resetForm();
  }, [show, view]);

  const handleLogin = async () => {
    setError(''); setFieldErrors({});
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => { onLogin(); onClose(); }, 800);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setIsLoading(false);
      }
    } catch {
      setError('Could not reach the server.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(''); setFieldErrors({});
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = { name, email, password };
      if (referralCode.trim()) body.referralCode = referralCode.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (dob) body.dob = dob;
      if (studyLevel) body.studyLevel = studyLevel;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('Account created! Please log in.');
        setTimeout(() => { onClose(); setView('login'); }, 1500);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setFieldErrors(parsed.fields);
        setIsLoading(false);
      }
    } catch {
      setError('Could not reach the server.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccessMessage('If that email exists, a reset link has been sent.');
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  const FieldError = ({ name }: { name: keyof FieldErrors }) =>
    fieldErrors[name]?.length ? (
      <p className="text-red-500 text-xs mt-1" style={inputStyle}>{fieldErrors[name]!.join(' ')}</p>
    ) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-up max-h-[92vh] overflow-y-auto">
        <div className="flex justify-end p-6 pb-0">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-4">
          {view === 'login' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                  WELCOME BACK
                </h2>
                <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                  Continue your sprint exactly where you left off.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = '/login/google'}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ fontFamily: "'Poppins', sans-serif", fontSize: '15px' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 -my-1">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>OR IGNOU MAIL</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Email</label>
                <div className="relative">
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <FieldError name="email" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Password</label>
                <div className="relative">
                  <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <FieldError name="password" />
              </div>

              <div className="text-right -mt-2">
                <button onClick={() => setView('forgot')} className="text-purple-600 text-sm hover:text-purple-700" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}>
                  Forgot password?
                </button>
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-red-600 text-sm" style={inputStyle}>{error}</p></div>}
              {successMessage && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3"><p className="text-green-700 text-sm font-semibold" style={inputStyle}>{successMessage}</p></div>}

              <button onClick={handleLogin} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60" style={btnStyle}>
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

              <div className="text-center">
                <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                  New here?{' '}
                  <button onClick={() => setView('signup')} className="text-purple-600 font-semibold">START FREE TRIAL</button>
                </p>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                  CREATE ACCOUNT
                </h2>
                <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                  Join 500+ core engineers mastering industry tools.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = '/login/google'}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ fontFamily: "'Poppins', sans-serif", fontSize: '15px' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 -my-1">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>OR EMAIL</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Full Name</label>
                <div className="relative">
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <FieldError name="name" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Email</label>
                <div className="relative">
                  <input type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <FieldError name="email" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Password</label>
                <div className="relative">
                  <input type="password" placeholder="Min 8 chars" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <FieldError name="password" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Phone <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Study Level <span className="text-gray-400 font-normal">(Optional)</span></label>
                <select value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} disabled={isLoading} className={`${inputClass} appearance-none bg-white`} style={inputStyle}>
                  <option value="">Select level</option>
                  {STUDY_LEVEL_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Referral Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input type="text" placeholder="FRIEND2025" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-red-600 text-sm" style={inputStyle}>{error}</p></div>}
              {successMessage && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3"><p className="text-green-700 text-sm font-semibold" style={inputStyle}>{successMessage}</p></div>}

              <button onClick={handleSignUp} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60" style={btnStyle}>
                {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
              </button>

              <div className="text-center">
                <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                  Already have an account? <button onClick={() => setView('login')} className="text-purple-600 font-semibold">LOGIN</button>
                </p>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                  RESET PASSWORD
                </h2>
                <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>Enter your registered email and we'll send you a reset link.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700" style={labelStyle}>Email</label>
                <div className="relative">
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className={inputClass} style={inputStyle} />
                  <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-red-600 text-sm" style={inputStyle}>{error}</p></div>}
              {successMessage && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3"><p className="text-green-700 text-sm font-semibold" style={inputStyle}>{successMessage}</p></div>}

              <button onClick={handleForgotPassword} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60" style={btnStyle}>
                {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>

              <div className="text-center">
                <button onClick={() => setView('login')} className="text-purple-600 font-semibold text-sm">← Back to Login</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [authedUser, setAuthedUser] = useState<AuthedUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<View>('login');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchSessionAndNotifications = async () => {
      setIsLoading(true);
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
        const sessionData = await sessionRes.json().catch(() => null);

        if (sessionData?.success && sessionData?.data?.user) {
          setAuthedUser(sessionData.data.user);

          const notifRes = await fetch('/api/notifications/unread-count', { credentials: 'include' });
          const notifData = await notifRes.json().catch(() => null);
          if (notifData?.success) {
            setUnreadCount(notifData.data.unreadCount);
          }
        } else {
          setAuthedUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setAuthedUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionAndNotifications();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    setAuthedUser(null);
    window.location.href = '/';
  };

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  // If still loading, show a blank screen (avoids flash)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, redirect to home (landing page)
  if (!authedUser) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar
        user={authedUser}
        onLogout={handleLogout}
        onShowAuth={(v) => { setAuthView(v); setShowAuthModal(true); }}
        unreadCount={unreadCount}
      />

      <main className="pt-24 pb-16">
        {children}
      </main>

      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        view={authView}
        setView={setAuthView}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
}
