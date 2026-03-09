'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Loader2,
  Check,
  X,
  Eye,
  Clock,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { getAdminSubmissions, getAdminSubmissionStats, approveSubmission, rejectSubmission, AdminSubmission, SubmissionStats } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | ''>('');
  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, statsRes] = await Promise.all([
        getAdminSubmissions({ status: statusFilter || undefined, limit: 50 }),
        getAdminSubmissionStats()
      ]);

      if (subsRes.success && subsRes.data) {
        setSubmissions(subsRes.data.submissions);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!confirm('Are you sure you want to approve this submission?')) return;
    setProcessing(true);
    try {
      await approveSubmission(submissionId);
      fetchData();
      setSelectedSubmission(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectNotes.trim()) return;
    setProcessing(true);
    try {
      await rejectSubmission(selectedSubmission.id, rejectNotes);
      fetchData();
      setRejectModal(false);
      setSelectedSubmission(null);
      setRejectNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const statusTabs = [
    { value: '', label: 'All', count: (stats?.pending || 0) + (stats?.underReview || 0) + (stats?.approvedToday || 0) },
    { value: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { value: 'under_review', label: 'Under Review', count: stats?.underReview || 0 },
    { value: 'approved', label: 'Approved', count: stats?.approvedToday || 0 },
    { value: 'rejected', label: 'Rejected', count: stats?.rejectedToday || 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Submissions</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Review and manage project submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statusTabs.slice(1).map((tab, i) => (
          <button
            key={i}
            onClick={() => setStatusFilter(tab.value as any)}
            className={`bg-white rounded-xl p-4 border ${statusFilter === tab.value ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-100'} shadow-sm transition-all`}
          >
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{tab.count}</p>
            <p className="text-sm text-gray-500" style={poppins}>{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={poppins}>No submissions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    submission.status === 'approved' ? 'bg-green-100 text-green-600' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900" style={poppins}>{submission.userName}</p>
                    <p className="text-sm text-gray-500" style={poppins}>{submission.courseName}</p>
                    <p className="text-xs text-gray-400" style={poppins}>{submission.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`} style={poppins}>
                    {submission.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processing}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedSubmission(submission); setRejectModal(true); }}
                          disabled={processing}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold mb-4" style={{ ...outfit, fontWeight: 800 }}>Reject Submission</h2>
            <p className="text-gray-600 mb-4" style={poppins}>
              Please provide feedback for the student:
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Explain what needs to be fixed..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={poppins}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRejectModal(false); setRejectNotes(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600"
                style={poppins}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectNotes.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white disabled:opacity-50"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
