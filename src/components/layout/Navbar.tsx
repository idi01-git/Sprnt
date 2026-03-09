'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Mail, Lock, User, Phone, Calendar, ChevronDown, LogOut } from 'lucide-react';

type View = 'login' | 'signup' | 'forgot';

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

const inputClass =
  'w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder:text-gray-400';
const inputStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  color: '#1f2937',
};
const labelStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  color: '#374151',
};
const btnStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: '15px',
};

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
    VALIDATION_ERROR: httpStatus === 409
      ? 'An account with this email already exists.'
      : message,
  };

  return {
    message: friendlyMessages[code] ?? message,
    fields: fieldErrors,
  };
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<View>('login');

  const [authedUser, setAuthedUser] = useState<AuthedUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.success && data?.data?.user) {
          setAuthedUser(data.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setDob(''); setStudyLevel(''); setReferralCode('');
    setError(''); setFieldErrors({}); setSuccessMessage(''); setIsLoading(false);
  };

  const openModal = (v: View) => { resetForm(); setView(v); setShowModal(true); };
  const closeModal = () => { setShowModal(false); resetForm(); };
  const switchView = (v: View) => { resetForm(); setView(v); };

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
        setTimeout(() => {
          closeModal();
          openModal('login');
        }, 1500);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setFieldErrors(parsed.fields);
        setIsLoading(false);
      }
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
      setIsLoading(false);
    }
  };

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
        setTimeout(() => {
          closeModal();
          window.location.href = '/dashboard';
        }, 800);
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
        setIsLoading(false);
      }
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(''); setFieldErrors({});

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
        setSuccessMessage('If that email exists, a reset link has been sent. Check your inbox.');
      } else {
        const parsed = parseApiError(data, res.status);
        setError(parsed.message);
      }
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    setAuthedUser(null);
  };

  const FieldError = ({ name }: { name: keyof FieldErrors }) =>
    fieldErrors[name]?.length ? (
      <p className="text-red-500 text-xs mt-1" style={inputStyle}>
        {fieldErrors[name]!.join(' ')}
      </p>
    ) : null;

  const StatusBlock = () => (
    <>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-red-600 text-sm" style={inputStyle}>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-green-700 text-sm font-semibold" style={inputStyle}>{successMessage}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-purple-500/10' : 'bg-transparent'
          }`}
        style={{ animation: 'slideDown 0.6s ease-out' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
              <img
                src="/images/mainlogo1-C1oyx5qb.png"
                alt="Logo"
                className="h-10 w-auto"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {([
                { label: 'Home', href: '/' },
                { label: 'Courses', href: '/#courses' },
                { label: 'How It Works', href: '/#roadmap' },
              ] as { label: string; href: string }[]).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-gray-700 hover:text-purple-600 transition-all duration-200 relative group hover:-translate-y-0.5"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '15px' }}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
              <Link
                href="/verify"
                className="text-gray-700 hover:text-purple-600 transition-all duration-200 relative group hover:-translate-y-0.5"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '15px' }}
              >
                Verify Certificate
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {authedUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {authedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-gray-700 group-hover:text-purple-600 transition-colors text-sm max-w-[120px] truncate">
                      {authedUser.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-scale-up origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {authedUser.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {authedUser.email}
                        </p>
                        {!authedUser.emailVerified && (
                          <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Email not verified
                          </span>
                        )}
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                      >
                        My Dashboard
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                      >
                        Wallet &amp; Referrals
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openModal('login')}
                    className="text-gray-700 hover:text-purple-600 transition-all duration-200 hover:scale-105"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '15px' }}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => openModal('signup')}
                    className="relative px-6 py-3 rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                    style={btnStyle}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_100%] animate-gradient" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />
                    <span className="relative text-white z-10">Start Free Trial</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="flex justify-end p-6 pb-0">
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pb-8 pt-4">

              {view === 'login' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      WELCOME BACK, ENGINEER.
                    </h2>
                    <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                      Continue your sprint exactly where you left off.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>Enter Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. rahul@ietlucknow.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="password" />
                  </div>

                  <div className="text-right -mt-2">
                    <button
                      onClick={() => switchView('forgot')}
                      className="text-purple-600 text-sm hover:text-purple-700 transition-all"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={btnStyle}
                  >
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>

                  <div className="text-center">
                    <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                      First time here?{' '}
                      <button onClick={() => switchView('signup')} className="text-purple-600 font-semibold hover:text-purple-700 transition-all" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                        START 14-DAY SPRINT →
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {view === 'signup' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      SETUP YOUR PROFILE
                    </h2>
                    <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                      Join 500+ core engineers mastering industry tools.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="name" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>College Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="yourname@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Min 8 chars · 1 uppercase · 1 number"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="password" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>
                      Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="phone" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>
                      Date of Birth <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                        max="2010-01-01"
                      />
                      <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="dob" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>
                      Study Level <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={studyLevel}
                        onChange={(e) => setStudyLevel(e.target.value)}
                        disabled={isLoading}
                        className={`${inputClass} appearance-none bg-white`}
                        style={inputStyle}
                      >
                        <option value="">Select your study level</option>
                        {STUDY_LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="studyLevel" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>
                      Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="FRIEND2025"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={isLoading}
                      className={inputClass}
                      style={inputStyle}
                    />
                    <p className="text-gray-400 text-xs" style={inputStyle}>
                      Have a code? Enter to get ₹50 cashback later.
                    </p>
                    <FieldError name="referralCode" />
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={btnStyle}
                  >
                    {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                  </button>

                  <div className="text-center">
                    <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                      Already have an account?{' '}
                      <button onClick={() => switchView('login')} className="text-purple-600 font-semibold hover:text-purple-700 transition-all" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                        LOGIN HERE
                      </button>
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
                    <p className="text-gray-600" style={{ ...inputStyle, fontSize: '14px' }}>
                      Enter your registered email and we&apos;ll send you a reset link.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm text-gray-700" style={labelStyle}>Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. rahul@ietlucknow.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleForgotPassword()}
                        disabled={isLoading}
                        className={inputClass}
                        style={inputStyle}
                      />
                      <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <FieldError name="email" />
                  </div>

                  <StatusBlock />

                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading || !!successMessage}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={btnStyle}
                  >
                    {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                  </button>

                  <div className="text-center">
                    <button onClick={() => switchView('login')} className="text-purple-600 font-semibold hover:text-purple-700 transition-all text-sm" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                      ← Back to Login
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
