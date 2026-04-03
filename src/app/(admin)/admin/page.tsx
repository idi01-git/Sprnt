'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  FileCheck,
  Wallet,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Award,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  GraduationCap
} from 'lucide-react';
import {
  getAdminKPIs,
  getAdminActionItems,
  getAdminRecentEnrollments,
  getAdminRecentSubmissions,
  getAdminRevenueChart,
  getAdminSignupsChart,
  AdminKPIs,
  AdminActionItems,
  RevenueData,
  SignupData,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

// ─── Simple SVG Bar Chart ──────────────────────────────────────────────────
function MiniBarChart({ data, color, valueKey }: {
  data: { date: string; [key: string]: any }[];
  color: string;
  valueKey: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400" style={poppins}>
        <p className="text-sm">No data available yet</p>
      </div>
    );
  }

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="relative h-48">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-gray-400" style={poppins}>
        <span>₹{maxVal.toLocaleString()}</span>
        <span>₹{Math.round(maxVal / 2).toLocaleString()}</span>
        <span>₹0</span>
      </div>
      {/* Bars */}
      <div className="ml-12 h-full flex items-end gap-1 pb-6">
        {data.map((d, i) => {
          const h = maxVal > 0 ? (values[i] / maxVal) * 100 : 0;
          const dateStr = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full min-w-[4px] rounded-t-md transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${Math.max(h, 2)}%`, background: color }}
                title={`${dateStr}: ₹${values[i].toLocaleString()}`}
              />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {dateStr}: ₹{values[i].toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="ml-12 flex justify-between text-[9px] text-gray-400" style={poppins}>
        {data.length > 0 && <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        {data.length > 1 && <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>
    </div>
  );
}

function MiniLineChart({ data, color, valueKey }: {
  data: { date: string; [key: string]: any }[];
  color: string;
  valueKey: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400" style={poppins}>
        <p className="text-sm">No data available yet</p>
      </div>
    );
  }

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const width = 400;
  const height = 150;
  const padding = 4;

  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (v / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${padding + ((values.length - 1) / Math.max(values.length - 1, 1)) * (width - 2 * padding)},${height - padding}`,
  ];

  return (
    <div className="relative h-48">
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400" style={poppins}>
        <span>{maxVal}</span>
        <span>{Math.round(maxVal / 2)}</span>
        <span>0</span>
      </div>
      <div className="ml-10 h-full pb-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints.join(' ')} fill={`url(#grad-${valueKey})`} />
          <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => {
            const [cx, cy] = p.split(',').map(Number);
            return <circle key={i} cx={cx} cy={cy} r="3" fill={color} className="opacity-0 hover:opacity-100 transition-opacity" />;
          })}
        </svg>
      </div>
      <div className="ml-10 flex justify-between text-[9px] text-gray-400" style={poppins}>
        {data.length > 0 && <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        {data.length > 1 && <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="w-16 h-6 bg-gray-100 rounded-full" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => <div key={i} className="h-72 bg-white rounded-2xl border border-gray-100" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100" />)}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [actionItems, setActionItems] = useState<AdminActionItems | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueData[]>([]);
  const [signupsChart, setSignupsChart] = useState<SignupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kpisRes, actionRes, enrollRes, subRes, revChartRes, signChartRes] = await Promise.all([
          getAdminKPIs(),
          getAdminActionItems(),
          getAdminRecentEnrollments(),
          getAdminRecentSubmissions(),
          getAdminRevenueChart(chartDays),
          getAdminSignupsChart(chartDays),
        ]);

        if (kpisRes.success && kpisRes.data) setKpis(kpisRes.data.kpis);
        if (actionRes.success && actionRes.data) setActionItems(actionRes.data.actionItems);
        if (enrollRes.success && enrollRes.data) setRecentEnrollments(enrollRes.data.enrollments || []);
        if (subRes.success && subRes.data) setRecentSubmissions(subRes.data.submissions || []);
        if (revChartRes.success && revChartRes.data) setRevenueChart(revChartRes.data.chart || []);
        if (signChartRes.success && signChartRes.data) setSignupsChart(signChartRes.data.chart || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chartDays]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600" style={poppins}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            style={poppins}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: kpis?.totalUsers?.toLocaleString() || '0',
      subtext: `+${kpis?.newUsersToday || 0} today`,
      positive: (kpis?.newUsersToday || 0) > 0,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      icon: BookOpen,
      label: 'Total Enrollments',
      value: kpis?.totalEnrollments?.toLocaleString() || '0',
      subtext: `${kpis?.paidEnrollments || 0} paid`,
      positive: true,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
    },
    {
      icon: DollarSign,
      label: 'Revenue Today',
      value: `₹${kpis?.revenueToday?.toLocaleString() || '0'}`,
      subtext: 'Today\'s earnings',
      positive: (kpis?.revenueToday || 0) > 0,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      label: 'Revenue This Month',
      value: `₹${kpis?.revenueMonth?.toLocaleString() || '0'}`,
      subtext: `${kpis?.newUsersMonth || 0} new users`,
      positive: (kpis?.revenueMonth || 0) > 0,
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-50',
    },
  ];

  const actionCards = [
    {
      icon: FileCheck,
      label: 'Pending Submissions',
      value: actionItems?.pendingSubmissions || 0,
      href: '/admin/submissions',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    {
      icon: Wallet,
      label: 'Pending Withdrawals',
      value: actionItems?.pendingWithdrawals || 0,
      href: '/admin/withdrawals',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      icon: UserPlus,
      label: 'Pending Verifications',
      value: actionItems?.pendingIdentityVerifications || 0,
      href: '/admin/submissions',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
  ];

  const totalPending = (actionItems?.pendingSubmissions || 0) + (actionItems?.pendingWithdrawals || 0) + (actionItems?.pendingIdentityVerifications || 0);

  // Helper to safely get name from nested enrollment/submission objects
  const getEnrollmentUserName = (e: any) => e?.user?.name || e?.userName || 'Unknown';
  const getEnrollmentCourseName = (e: any) => e?.course?.courseName || e?.courseName || 'Unknown';
  const getEnrollmentAmount = (e: any) => Number(e?.amountPaid || e?.amount || 0);
  const getEnrollmentDate = (e: any) => e?.enrolledAt || e?.createdAt;

  const getSubmissionUserName = (s: any) => s?.user?.name || s?.userName || 'Unknown';
  const getSubmissionCourseName = (s: any) => s?.enrollment?.course?.courseName || s?.courseName || 'Unknown';
  const getSubmissionStatus = (s: any) => s?.reviewStatus || s?.status || 'pending';
  const getSubmissionDate = (s: any) => s?.submittedAt || s?.createdAt;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>
              Overview of your platform performance
            </p>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <Activity className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700" style={poppins}>
                {totalPending} items need attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${card.positive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`} style={poppins}>
                  {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.subtext}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                {card.value}
              </p>
              <p className="text-sm text-gray-500 mt-1" style={poppins}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500" style={poppins}>Courses</p>
              <p className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>{kpis?.totalCourses || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500" style={poppins}>Paid Enrollments</p>
              <p className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>{kpis?.paidEnrollments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500" style={poppins}>Users Today</p>
              <p className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>{kpis?.newUsersToday || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500" style={poppins}>Users This Month</p>
              <p className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>{kpis?.newUsersMonth || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {actionCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className={`bg-white rounded-2xl p-6 border ${card.value > 0 ? card.borderColor : 'border-gray-100'} shadow-sm hover:shadow-md transition-all flex items-center justify-between group`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500" style={poppins}>{card.label}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                Revenue
              </h2>
              <p className="text-xs text-gray-500 mt-0.5" style={poppins}>Daily revenue trend</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartDays === d ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  style={poppins}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={revenueChart} color="#8b5cf6" valueKey="revenue" />
        </div>

        {/* Signups Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                User Signups
              </h2>
              <p className="text-xs text-gray-500 mt-0.5" style={poppins}>New registrations trend</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500" style={poppins}>New Users</span>
              </div>
            </div>
          </div>
          <MiniLineChart data={signupsChart} color="#3b82f6" valueKey="newUsers" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                Recent Enrollments
              </h2>
            </div>
            <Link href="/admin/courses" className="text-sm text-purple-600 hover:underline font-medium" style={poppins}>
              View All
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm" style={poppins}>No recent enrollments</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentEnrollments.slice(0, 5).map((enrollment: any, i: number) => (
                <div key={enrollment.id || i} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getEnrollmentUserName(enrollment).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate" style={poppins}>
                        {getEnrollmentUserName(enrollment)}
                      </p>
                      <p className="text-xs text-gray-500 truncate" style={poppins}>
                        {getEnrollmentCourseName(enrollment)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-green-600" style={poppins}>
                      ₹{getEnrollmentAmount(enrollment).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400" style={poppins}>
                      {getEnrollmentDate(enrollment) ? new Date(getEnrollmentDate(enrollment)).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
                Recent Submissions
              </h2>
            </div>
            <Link href="/admin/submissions" className="text-sm text-purple-600 hover:underline font-medium" style={poppins}>
              View All
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm" style={poppins}>No recent submissions</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentSubmissions.slice(0, 5).map((submission: any, i: number) => {
                const status = getSubmissionStatus(submission);
                return (
                  <div key={submission.id || i} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        status === 'approved' ? 'bg-green-100 text-green-600' :
                        status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate" style={poppins}>
                          {getSubmissionUserName(submission)}
                        </p>
                        <p className="text-xs text-gray-500 truncate" style={poppins}>
                          {getSubmissionCourseName(submission)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`} style={poppins}>
                        {status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-gray-400 mt-1" style={poppins}>
                        {getSubmissionDate(submission) ? new Date(getSubmissionDate(submission)).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
