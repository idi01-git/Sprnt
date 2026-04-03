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
  Award,
  X,
  User,
  GraduationCap,
  ChevronDown,
  Link as LinkIcon,
} from 'lucide-react';
import { getSubmissions, Submission } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Review' },
  under_review: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Under Review' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Needs Resubmission' },
  resubmitted: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Resubmitted' },
};

const BRANCH_OPTIONS = [
  'Chemical Engineering', 'Civil Engineering', 'Mechanical Engineering',
  'Electrical Engineering', 'Electronics & Communication', 'Computer Science / IT',
  'Other',
];

interface IdentityData {
  fullName: string;
  collegeName: string;
  graduationYear: string;
  branch: string;
  collegeIdLink: string;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isDriveLink(str: string): boolean {
  return isValidUrl(str) && (
    str.includes('drive.google.com') ||
    str.includes('docs.google.com')
  );
}

function IdentityModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: (data: IdentityData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<IdentityData>({
    fullName: '', collegeName: '', graduationYear: '', branch: '', collegeIdLink: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof IdentityData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.collegeName.trim()) errs.collegeName = 'College name is required';
    if (!form.graduationYear) errs.graduationYear = 'Graduation year is required';
    if (!form.branch) errs.branch = 'Branch / stream is required';
    if (!form.collegeIdLink.trim()) errs.collegeIdLink = 'College ID Drive link is required';
    else if (!isDriveLink(form.collegeIdLink)) errs.collegeIdLink = 'Must be a Google Drive or Google Docs link';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onConfirm(form);
  };

  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + 2 - i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                Identity Verification
              </h2>
              <p className="text-sm text-gray-500 mt-0.5" style={poppins}>
                Required for certificate generation
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                placeholder="As it should appear on certificate"
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                style={poppins}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
              College / School Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.collegeName}
                onChange={e => set('collegeName', e.target.value)}
                placeholder="Your institution name"
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${errors.collegeName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                style={poppins}
              />
            </div>
            {errors.collegeName && <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.collegeName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
                Branch / Stream <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.branch}
                  onChange={e => set('branch', e.target.value)}
                  className={`w-full px-3 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none transition-all ${errors.branch ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  style={poppins}
                >
                  <option value="">Select…</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.branch && <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.branch}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
                Graduation Year <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.graduationYear}
                  onChange={e => set('graduationYear', e.target.value)}
                  className={`w-full px-3 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none transition-all ${errors.graduationYear ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  style={poppins}
                >
                  <option value="">Year…</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.graduationYear && <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.graduationYear}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
              College ID (Drive Link) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={form.collegeIdLink}
                onChange={e => set('collegeIdLink', e.target.value)}
                placeholder="https://drive.google.com/..."
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${errors.collegeIdLink ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                style={poppins}
              />
            </div>
            {errors.collegeIdLink && <p className="text-red-500 text-xs mt-1" style={poppins}>{errors.collegeIdLink}</p>}
            <p className="text-xs text-gray-400 mt-1" style={poppins}>
              Upload your college ID photo to Google Drive and paste the link here
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-700 leading-relaxed" style={poppins}>
              Upload your college ID photo to Google Drive (make it "Anyone with the link can view"), then paste the link above.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{ ...poppins, fontWeight: 600 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'Submit Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DriveLinkInput({
  label,
  hint,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const isValid = value.length > 0 && !isDriveLink(value);
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
        {label}
      </label>
      <div className="relative">
        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://drive.google.com/..."
          className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${error ? 'border-red-400 bg-red-50' : value && !isDriveLink(value) ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
          style={poppins}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1" style={poppins}>{error}</p>}
      {!error && isValid && <p className="text-amber-500 text-xs mt-1" style={poppins}>Must be a Google Drive or Google Docs link</p>}
      {!error && !isValid && value && <p className="text-xs text-gray-400 mt-1" style={poppins}>{hint}</p>}
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    }>
      <SubmitPageContent />
    </Suspense>
  );
}

function SubmitPageContent() {
  const searchParams = useSearchParams();
  const enrollmentIdParam = searchParams.get('enrollmentId') || '';

  const [enrollmentId, setEnrollmentId] = useState(enrollmentIdParam);
  const [projectDriveLink, setProjectDriveLink] = useState('');
  const [linkErrors, setLinkErrors] = useState<{ project?: string; report?: string }>({});

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [submitSuccess]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const response = await getSubmissions(1, 50);
      if (response.success && response.data) {
        setSubmissions(response.data.submissions);
      }
    } catch { /* silent */ } finally {
      setLoadingSubs(false);
    }
  };

  const validateLinks = () => {
    const errs: typeof linkErrors = {};
    if (!projectDriveLink.trim()) errs.project = 'Project Drive link is required';
    else if (!isDriveLink(projectDriveLink)) errs.project = 'Must be a Google Drive or Google Docs link';
    if (!enrollmentId.trim()) {
      setSubmitError('Please enter your Enrollment ID.');
      return false;
    }
    setLinkErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (validateLinks()) setShowIdentityModal(true);
  };

  const handleFinalSubmit = async (identity: IdentityData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          driveLink: projectDriveLink,
          fullName: identity.fullName,
          collegeName: identity.collegeName,
          collegeIdLink: identity.collegeIdLink,
          branch: identity.branch,
          graduationYear: parseInt(identity.graduationYear),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Submission failed');
      }

      setShowIdentityModal(false);
      setSubmitSuccess(true);
      setProjectDriveLink('');
    } catch (err: any) {
      setShowIdentityModal(false);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      {showIdentityModal && (
        <IdentityModal
          onClose={() => setShowIdentityModal(false)}
          onConfirm={handleFinalSubmit}
          loading={submitting}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
          Project Submissions
        </h1>
        <p className="text-gray-500 mb-8 text-sm" style={poppins}>
          Complete all 7 days and pass every quiz before submitting your project.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <Upload className="w-5 h-5 text-purple-600" /> New Submission
            </h2>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-green-700 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                  Submitted Successfully!
                </h3>
                <p className="text-gray-500 text-sm mb-5" style={poppins}>
                  Your project is now under review. We'll notify you when it's graded.
                </p>
                <button
                  onClick={() => { setSubmitSuccess(false); setEnrollmentId(enrollmentIdParam); }}
                  className="text-purple-600 text-sm hover:underline"
                  style={{ ...poppins, fontWeight: 500 }}
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleContinue} className="space-y-5">
                <div>
                  <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    value={enrollmentId}
                    onChange={e => setEnrollmentId(e.target.value)}
                    required
                    placeholder="Your enrollment ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    style={poppins}
                  />
                  <p className="text-xs text-gray-400 mt-1" style={poppins}>
                    Find this on your dashboard next to the course name.
                  </p>
                </div>

                <DriveLinkInput
                  label="Project Drive Link"
                  hint="Upload your project files to Drive and paste the link"
                  value={projectDriveLink}
                  onChange={v => { setProjectDriveLink(v); setLinkErrors(p => ({ ...p, project: undefined })); }}
                  error={linkErrors.project}
                />

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-700 leading-relaxed" style={poppins}>
                    <strong>How to share your project:</strong><br />
                    1. Upload your project folder/files to Google Drive<br />
                    2. Click "Share" → "Anyone with the link"<br />
                    3. Paste that link above
                  </p>
                </div>

                {submitError && (
                  <div className="px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm flex gap-2" style={poppins}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  <Upload className="w-4 h-4" /> Continue to Submit
                </button>

                <p className="text-center text-xs text-gray-400" style={poppins}>
                  You'll be asked for identity details before final submission
                </p>
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
                          {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {sub.finalGrade !== null && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-purple-500" />
                            {sub.finalGrade} / 5 — {sub.gradeCategory}
                          </span>
                        )}
                        {sub.resubmissionCount > 0 && (
                          <span className="text-gray-400">
                            Resubmissions: {sub.resubmissionCount}/{sub.maxResubmissions}
                          </span>
                        )}
                      </div>

                      {sub.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600" style={poppins}>
                          <span className="font-semibold text-gray-700">Admin feedback: </span>
                          {sub.adminNotes}
                        </div>
                      )}
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