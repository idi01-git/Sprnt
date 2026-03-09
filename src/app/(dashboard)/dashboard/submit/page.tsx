'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Award
} from 'lucide-react';
import { getSubmissions, createSubmission, Submission } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Review' },
  under_review: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Under Review' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Needs Resubmission' },
  resubmitted: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Resubmitted' },
};

export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitPageLoading />}>
      <SubmitPageContent />
    </Suspense>
  );
}

function SubmitPageLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    </div>
  );
}

function SubmitPageContent() {
  const searchParams = useSearchParams();
  const enrollmentIdParam = searchParams.get('enrollmentId') || '';

  const [enrollmentId, setEnrollmentId] = useState(enrollmentIdParam);
  const [projectUrl, setProjectUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoadingSubs(true);
      try {
        const response = await getSubmissions(1, 50);
        if (response.success && response.data) {
          setSubmissions(response.data.submissions);
        }
      } catch {
        // silent fail
      } finally {
        setLoadingSubs(false);
      }
    };
    fetchSubmissions();
  }, [submitSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await createSubmission({
        enrollmentId,
        projectFileUrl: projectUrl,
        reportPdfUrl: reportUrl,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to submit');
      }

      setSubmitSuccess(true);
      setProjectUrl('');
      setReportUrl('');
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
          Project Submissions
        </h1>
        <p className="text-gray-500 mb-8" style={{ ...poppins, fontSize: '15px' }}>
          Submit your project and report after completing all 7 days
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <Upload className="w-5 h-5 text-purple-600" /> New Submission
            </h2>

            {submitSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-700 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                  Submitted Successfully!
                </h3>
                <p className="text-gray-500 text-sm mb-4" style={poppins}>
                  Your submission is now under review.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-purple-600 text-sm hover:underline"
                  style={{ ...poppins, fontWeight: 500 }}
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ ...poppins, fontWeight: 600 }}>
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    value={enrollmentId}
                    onChange={e => setEnrollmentId(e.target.value)}
                    required
                    placeholder="Your enrollment ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                    style={poppins}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ ...poppins, fontWeight: 600 }}>
                    Project URL <span className="text-gray-400 font-normal">(GitHub link)</span>
                  </label>
                  <input
                    type="url"
                    value={projectUrl}
                    onChange={e => setProjectUrl(e.target.value)}
                    required
                    placeholder="https://github.com/username/project"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                    style={poppins}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ ...poppins, fontWeight: 600 }}>
                    Report PDF URL <span className="text-gray-400 font-normal">(Google Drive / hosted link)</span>
                  </label>
                  <input
                    type="url"
                    value={reportUrl}
                    onChange={e => setReportUrl(e.target.value)}
                    required
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                    style={poppins}
                  />
                </div>

                {submitError && (
                  <div className="px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm" style={poppins}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Submit Project</>
                  )}
                </button>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <FileText className="w-5 h-5 text-purple-600" /> Your Submissions
            </h2>

            {loadingSubs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm" style={poppins}>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => {
                  const status = statusColors[sub.reviewStatus] || statusColors.pending;
                  return (
                    <div key={sub.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900" style={poppins}>
                          {sub.courseName}
                        </h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${status.bg} ${status.text}`} style={{ ...poppins, fontWeight: 600 }}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500" style={poppins}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                        {sub.finalGrade !== null && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Grade: {sub.finalGrade} ({sub.gradeCategory})
                          </span>
                        )}
                        {sub.resubmissionCount > 0 && (
                          <span className="text-gray-400">
                            Resubmissions: {sub.resubmissionCount}/{sub.maxResubmissions}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
