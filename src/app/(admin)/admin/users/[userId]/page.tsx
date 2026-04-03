'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, User, Mail, Phone, Calendar, BookOpen, FileCheck, Award,
  Gift, Wallet, Shield, ShieldOff, RefreshCw, LogOut, UserPlus,
  CheckCircle2, XCircle, Clock, ChevronRight, AlertCircle, Loader2, Copy, Check,
} from 'lucide-react';
import {
  getAdminUserDetail, suspendAdminUser, activateAdminUser,
  getAdminUserEnrollments, getAdminUserSubmissions,
  getAdminUserReferrals, getAdminUserTransactions,
  adminResetUserPassword, adminRevokeUserSessions, adminManualEnroll,
  getAdminCourses, AdminUserDetail,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const TABS = ['Overview', 'Enrollments', 'Submissions', 'Referrals', 'Transactions'] as const;
type Tab = typeof TABS[number];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    under_review: 'bg-blue-100 text-blue-700',
    resubmitted: 'bg-purple-100 text-purple-700',
    valid: 'bg-green-100 text-green-700',
    revoked: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (n?: number) => n != null ? `₹${n.toFixed(2)}` : '—';

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [tabData, setTabData] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [courses, setCourses] = useState<{ id: string; courseName: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [copiedPw, setCopiedPw] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { fetchTabData(tab); }, [tab, userId]);

  async function fetchUser() {
    setLoading(true);
    const res = await getAdminUserDetail(userId);
    if (res.success && res.data) setUser(res.data.user);
    setLoading(false);
  }

  async function fetchTabData(t: Tab) {
    if (t === 'Overview') return;
    setTabLoading(true);
    let res;
    if (t === 'Enrollments') res = await getAdminUserEnrollments(userId);
    else if (t === 'Submissions') res = await getAdminUserSubmissions(userId);
    else if (t === 'Referrals') res = await getAdminUserReferrals(userId);
    else if (t === 'Transactions') res = await getAdminUserTransactions(userId);

    if (res?.success && res.data) {
      const key = t.toLowerCase();
      setTabData((res.data as any)[key] || []);
    } else {
      setTabData([]);
    }
    setTabLoading(false);
  }

  async function handleToggleStatus() {
    if (!user) return;
    setActionLoading('status');
    const fn = user.status === 'active' ? suspendAdminUser : activateAdminUser;
    const res = await fn(userId);
    if (res.success) { showToast(`User ${user.status === 'active' ? 'suspended' : 'activated'}`); fetchUser(); }
    else showToast('Action failed', false);
    setActionLoading(null);
  }

  async function handleResetPassword() {
    setActionLoading('pw');
    const res = await adminResetUserPassword(userId);
    if (res.success) {
      const pw = res.data?.temporaryPassword;
      if (pw) {
        setCopiedPw(pw);
        navigator.clipboard.writeText(pw).catch(() => {});
      }
      showToast('Password reset — temporary password copied!');
    } else showToast('Reset failed', false);
    setActionLoading(null);
  }

  async function handleRevokeSessions() {
    setActionLoading('sessions');
    const res = await adminRevokeUserSessions(userId);
    if (res.success) showToast('All sessions revoked');
    else showToast('Revoke failed', false);
    setActionLoading(null);
  }

  async function handleManualEnroll() {
    if (!selectedCourse) return;
    setActionLoading('enroll');
    const res = await adminManualEnroll(userId, selectedCourse);
    if (res.success) { showToast('Enrolled successfully'); setShowEnrollModal(false); fetchTabData('Enrollments'); }
    else showToast('Enrollment failed', false);
    setActionLoading(null);
  }

  async function openEnrollModal() {
    setShowEnrollModal(true);
    const res = await getAdminCourses({ status: 'active', limit: 50 });
    if (res.success && res.data) setCourses(res.data.courses.map(c => ({ id: c.id, courseName: c.courseName })));
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-8" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500" style={poppins}>User not found</p>
        <Link href="/admin/users" className="text-purple-600 hover:underline text-sm" style={poppins}>Back to Users</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Manual Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 800 }}>Manual Enrollment</h2>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none mb-4 text-sm"
              style={poppins}
            >
              <option value="">Select a course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={poppins}>Cancel</button>
              <button
                onClick={handleManualEnroll}
                disabled={!selectedCourse || actionLoading === 'enroll'}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'enroll' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6 transition-colors" style={poppins}>
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0" style={{ ...outfit, fontWeight: 800 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{user.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(user.status)}`} style={poppins}>{user.status}</span>
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-green-600 text-xs" style={poppins}><Shield className="w-3.5 h-3.5" /> Verified</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs" style={poppins}><ShieldOff className="w-3.5 h-3.5" /> Unverified</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-4" style={poppins}>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
              {user.dob && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmt(user.dob)}</span>}
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{user.studyLevel?.replace(/_/g, ' ') || 'No study level'}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Joined {fmt(user.createdAt)}</span>
            </div>

            {/* Temp password display */}
            {copiedPw && (
              <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800" style={poppins}>Temp password: <strong className="font-mono">{copiedPw}</strong></p>
                <button onClick={() => { navigator.clipboard.writeText(copiedPw); }} className="p-1 hover:bg-amber-200 rounded">
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                </button>
                <button onClick={() => setCopiedPw(null)} className="ml-auto text-amber-600 hover:text-amber-800 text-xs" style={poppins}>Dismiss</button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading === 'status'}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-60 ${user.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : user.status === 'active' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading === 'pw'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 text-sm disabled:opacity-60 transition-all"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'pw' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Reset Password
              </button>
              <button
                onClick={handleRevokeSessions}
                disabled={actionLoading === 'sessions'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm disabled:opacity-60 transition-all"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {actionLoading === 'sessions' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Revoke Sessions
              </button>
              <button
                onClick={openEnrollModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-md text-sm transition-all"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <UserPlus className="w-4 h-4" /> Manual Enroll
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map(t => {
            const icons: Record<Tab, React.ElementType> = { Overview: User, Enrollments: BookOpen, Submissions: FileCheck, Referrals: Gift, Transactions: Wallet };
            const Icon = icons[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap border-b-2 transition-all ${tab === t ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                style={{ ...poppins, fontWeight: tab === t ? 600 : 400 }}
              >
                <Icon className="w-4 h-4" />{t}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {tab === 'Overview' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Mail, label: 'Email', value: user.email },
                { icon: Phone, label: 'Phone', value: user.phone || '—' },
                { icon: Calendar, label: 'Date of Birth', value: fmt(user.dob) },
                { icon: User, label: 'Study Level', value: user.studyLevel?.replace(/_/g, ' ') || '—' },
                { icon: Clock, label: 'Joined', value: fmt(user.createdAt) },
                { icon: Shield, label: 'Email Verified', value: user.emailVerified ? 'Yes' : 'No' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-purple-500" />
                      <p className="text-xs text-gray-500" style={poppins}>{f.label}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm" style={poppins}>{f.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generic tab content with loading */}
          {tab !== 'Overview' && (
            tabLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
              </div>
            ) : tabData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400" style={poppins}>No {tab.toLowerCase()} found for this user</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Enrollments */}
                {tab === 'Enrollments' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Course', 'Progress', 'Status', 'Enrolled'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold" style={poppins}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((e: any, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900" style={poppins}>{e.courseName}</td>
                          <td className="py-3 px-4 text-gray-600" style={poppins}>Day {e.currentDay} / {e.totalDays || 7}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(e.status)}`} style={poppins}>{e.status?.replace(/_/g, ' ')}</span></td>
                          <td className="py-3 px-4 text-gray-500" style={poppins}>{fmt(e.enrolledAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Submissions */}
                {tab === 'Submissions' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Course', 'Status', 'Grade', 'Submitted', 'Action'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold" style={poppins}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((s: any, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900" style={poppins}>{s.courseName}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(s.status)}`} style={poppins}>{s.status?.replace(/_/g, ' ')}</span></td>
                          <td className="py-3 px-4 text-gray-600" style={poppins}>{s.grade || '—'}</td>
                          <td className="py-3 px-4 text-gray-500" style={poppins}>{fmt(s.submittedAt)}</td>
                          <td className="py-3 px-4">
                            <Link href={`/admin/submissions/${s.id}`} className="flex items-center gap-1 text-purple-600 hover:underline text-xs" style={poppins}>View <ChevronRight className="w-3 h-3" /></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Referrals */}
                {tab === 'Referrals' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Referred User', 'Email', 'Bonus', 'Status', 'Date'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold" style={poppins}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((r: any, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900" style={poppins}>{r.refereeName || r.name || '—'}</td>
                          <td className="py-3 px-4 text-gray-500" style={poppins}>{r.refereeEmail || r.email || '—'}</td>
                          <td className="py-3 px-4 font-bold text-green-600" style={poppins}>{fmtAmount(r.bonusAmount)}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(r.status)}`} style={poppins}>{r.status}</span></td>
                          <td className="py-3 px-4 text-gray-500" style={poppins}>{fmt(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Transactions */}
                {tab === 'Transactions' && (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Type', 'Description', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold" style={poppins}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tabData.map((t: any, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4"><span className="capitalize text-gray-600 font-semibold" style={poppins}>{t.type?.replace(/_/g, ' ')}</span></td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate" style={poppins}>{t.description}</td>
                          <td className={`py-3 px-4 font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`} style={poppins}>{fmtAmount(t.amount)}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(t.status)}`} style={poppins}>{t.status}</span></td>
                          <td className="py-3 px-4 text-gray-500" style={poppins}>{fmt(t.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
