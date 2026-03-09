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
  Loader2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Award
} from 'lucide-react';
import {
  getAdminKPIs,
  getAdminActionItems,
  getAdminRecentEnrollments,
  getAdminRecentSubmissions,
  AdminKPIs,
  AdminActionItems,
  RecentEnrollment,
  RecentSubmission
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [actionItems, setActionItems] = useState<AdminActionItems | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kpisRes, actionRes, enrollRes, subRes] = await Promise.all([
          getAdminKPIs(),
          getAdminActionItems(),
          getAdminRecentEnrollments(),
          getAdminRecentSubmissions()
        ]);

        if (kpisRes.success && kpisRes.data) setKpis(kpisRes.data.kpis);
        if (actionRes.success && actionRes.data) setActionItems(actionRes.data.actionItems);
        if (enrollRes.success && enrollRes.data) setRecentEnrollments(enrollRes.data.enrollments);
        if (subRes.success && subRes.data) setRecentSubmissions(subRes.data.submissions);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500" style={poppins}>{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: kpis?.totalUsers?.toLocaleString() || '0',
      change: '+12%',
      positive: true,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      label: 'Total Enrollments',
      value: kpis?.totalEnrollments?.toLocaleString() || '0',
      change: '+8%',
      positive: true,
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: DollarSign,
      label: 'Revenue Today',
      value: `₹${kpis?.revenueToday?.toLocaleString() || '0'}`,
      change: '+23%',
      positive: true,
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      label: 'Revenue This Month',
      value: `₹${kpis?.revenueThisMonth?.toLocaleString() || '0'}`,
      change: '+15%',
      positive: true,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const actionCards = [
    {
      icon: FileCheck,
      label: 'Pending Submissions',
      value: actionItems?.pendingSubmissions || 0,
      href: '/admin/submissions',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Wallet,
      label: 'Pending Withdrawals',
      value: actionItems?.pendingWithdrawals || 0,
      href: '/admin/withdrawals',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: UserPlus,
      label: 'Pending Verifications',
      value: actionItems?.pendingIdentityVerifications || 0,
      href: '/admin/submissions',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>
          Overview of your platform performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={poppins}>
                  {card.change}
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

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {actionCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500" style={poppins}>{card.label}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
              Recent Enrollments
            </h2>
            <Link href="/admin/courses" className="text-sm text-purple-600 hover:underline" style={{ ...poppins, fontWeight: 500 }}>
              View All
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <p className="text-gray-400 text-center py-8" style={poppins}>No recent enrollments</p>
          ) : (
            <div className="space-y-4">
              {recentEnrollments.slice(0, 5).map((enrollment, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {enrollment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900" style={poppins}>{enrollment.userName}</p>
                      <p className="text-xs text-gray-500" style={poppins}>{enrollment.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600" style={poppins}>₹{enrollment.amount}</p>
                    <p className="text-xs text-gray-400" style={poppins}>
                      {new Date(enrollment.createdAt).toLocaleDateString()}
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
            <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
              Recent Submissions
            </h2>
            <Link href="/admin/submissions" className="text-sm text-purple-600 hover:underline" style={{ ...poppins, fontWeight: 500 }}>
              View All
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <p className="text-gray-400 text-center py-8" style={poppins}>No recent submissions</p>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.slice(0, 5).map((submission, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      submission.status === 'approved' ? 'bg-green-100 text-green-600' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900" style={poppins}>{submission.userName}</p>
                      <p className="text-xs text-gray-500" style={poppins}>{submission.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`} style={{ ...poppins, fontWeight: 500 }}>
                      {submission.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1" style={poppins}>
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
