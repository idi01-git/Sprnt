'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Calendar,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { getEnrollments, Enrollment } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const branchGradients: Record<string, string> = {
  Chemical: 'from-pink-500 to-rose-500',
  Civil: 'from-emerald-500 to-teal-500',
  Mechanical: 'from-purple-500 to-indigo-500',
  Electrical: 'from-blue-500 to-cyan-500',
  ECE: 'from-red-500 to-pink-500',
  CS_IT: 'from-green-500 to-emerald-500',
};

export default function DashboardPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getEnrollments({ limit: 50 });

        if (response.success && response.data) {
          setEnrollments(response.data.enrollments);
        } else {
          if (response.error?.message?.includes('log in') || response.error?.code === 'AUTH_SESSION_EXPIRED') {
            setError('Please log in to view your dashboard.');
          } else {
            setError(response.error?.message || 'Failed to load enrollments');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const filtered = tab === 'all' ? enrollments : enrollments.filter(e => e.status === tab);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-pulse">
            <div>
              <div className="h-9 w-52 bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 w-36 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
          {/* Enrollment card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-2 bg-gray-100 rounded-full mb-2" />
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            {error.includes('log in') ? 'Login Required' : 'Error'}
          </h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>{error}</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ ...outfit, fontWeight: 800 }}>
            No courses yet
          </h2>
          <p className="text-gray-500 mb-8" style={{ ...poppins, fontSize: '16px' }}>
            Browse our catalog and enroll in your first course to get started!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <Sparkles className="w-5 h-5" /> Explore Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
            My Learning
          </h1>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>
            Track your progress across all enrolled courses
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {(['all', 'in_progress', 'completed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm transition-all ${tab === t
                  ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200'
                }`}
              style={{ ...poppins, fontWeight: 600 }}
            >
              {t === 'all' ? 'All Courses' : t === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {filtered.map((enrollment) => {
            const gradient = branchGradients[enrollment.affiliatedBranch] || 'from-gray-500 to-slate-500';
            const progress = Math.round((enrollment.daysCompleted / enrollment.totalDays) * 100);

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 bg-linear-to-b ${gradient} shrink-0`} />

                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <span
                          className="inline-block text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 mb-2"
                          style={{ ...poppins, fontWeight: 600 }}
                        >
                          {enrollment.affiliatedBranch}
                        </span>

                        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 700 }}>
                          {enrollment.courseName}
                        </h3>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4" style={poppins}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Day {enrollment.currentDay} of {enrollment.totalDays}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {enrollment.daysCompleted}/{enrollment.totalDays} quizzes passed
                          </span>
                        </div>

                        <div className="w-full max-w-md bg-gray-100 rounded-full h-2.5 mb-1">
                          <div
                            className={`h-full rounded-full bg-linear-to-r ${gradient} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400" style={poppins}>{progress}% complete</p>
                      </div>

                        <div className="flex flex-col gap-2">
                        {/* Enrollment ID - Always visible */}
                        <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-0.5" style={poppins}>Enrollment ID</p>
                          <p className="text-sm font-mono font-bold text-gray-800 truncate" style={poppins} title={enrollment.id}>
                            {enrollment.id}
                          </p>
                        </div>

                        {enrollment.certificateIssued ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                            <Award className="w-4 h-4" /> Certified
                          </span>
                        ) : enrollment.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </span>
                        ) : null}

                        {enrollment.certificateIssued && enrollment.certificateId && (
                          <div className="mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-0.5" style={poppins}>Certificate ID</p>
                            <p className="text-sm font-mono font-bold text-gray-800 truncate" style={poppins} title={enrollment.certificateId}>
                              {enrollment.certificateId}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/learn/${enrollment.id}/day/${enrollment.currentDay}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                          style={{ ...poppins, fontWeight: 600 }}
                        >
                          Continue <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
