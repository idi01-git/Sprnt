'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    GraduationCap,
    Award,
    FileText,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Save,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from 'lucide-react';
import { fetchApi, approveSubmission, rejectSubmission } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface SubmissionDetail {
    id: string;
    enrollment: {
        id: string;
        user: { id: string; name: string; email: string };
        course: { id: string; courseName: string };
    };
    identity: {
        fullName: string;
        collegeName: string;
        branch: string;
        graduationYear: number;
        collegeIdUrl: string | null;
    } | null;
    projectFileUrl: string | null;
    reportPdfUrl: string | null;
    reviewStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';
    gradeMetrics: GradeMetrics | null;
    finalGrade: number | null;
    gradeCategory: string | null;
    adminNotes: string | null;
    submittedAt: string;
}

interface GradeMetrics {
    simulationAccuracy: number;   // weight 25%
    logicMethodology: number;     // weight 25%
    industrialOutput: number;     // weight 20%
    sensitivityAnalysis: number;  // weight 15%
    documentation: number;        // weight 15%
}

const METRICS: { key: keyof GradeMetrics; label: string; weight: number; description: string }[] = [
    { key: 'simulationAccuracy', label: 'Simulation Accuracy', weight: 0.25, description: 'How accurately the simulation models real-world behaviour' },
    { key: 'logicMethodology', label: 'Logic & Methodology', weight: 0.25, description: 'Soundness of the approach and reasoning used' },
    { key: 'industrialOutput', label: 'Industrial Output', weight: 0.20, description: 'Quality and relevance of the output to industry standards' },
    { key: 'sensitivityAnalysis', label: 'Sensitivity Analysis', weight: 0.15, description: 'Testing how results change under different assumptions' },
    { key: 'documentation', label: 'Documentation', weight: 0.15, description: 'Clarity, completeness and presentation of the report' },
];

function getGradeCategory(grade: number): { label: string; color: string } {
    if (grade >= 4.5) return { label: 'Distinction', color: 'text-purple-700' };
    if (grade >= 4.0) return { label: 'First Class', color: 'text-blue-700' };
    if (grade >= 3.0) return { label: 'Pass', color: 'text-green-700' };
    return { label: 'Fail', color: 'text-red-700' };
}

function calcFinalGrade(metrics: GradeMetrics): number {
    return (
        metrics.simulationAccuracy * 0.25 +
        metrics.logicMethodology * 0.25 +
        metrics.industrialOutput * 0.20 +
        metrics.sensitivityAnalysis * 0.15 +
        metrics.documentation * 0.15
    );
}

type SliderProps = { value: number; onChange: (v: number) => void; disabled?: boolean };
function GradeSlider({ value, onChange, disabled }: SliderProps) {
    const pct = ((value - 0) / 5) * 100;
    return (
        <div className="flex items-center gap-3">
            <input
                type="range" min={0} max={5} step={0.5}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="flex-1 accent-purple-600"
            />
            <span className={`text-sm font-bold w-10 text-right ${value >= 4 ? 'text-green-600' : value >= 2.5 ? 'text-amber-600' : 'text-red-600'
                }`} style={poppins}>{value.toFixed(1)}</span>
        </div>
    );
}

export default function SubmissionReviewPage() {
    const { submissionId } = useParams() as { submissionId: string };
    const router = useRouter();

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [metrics, setMetrics] = useState<GradeMetrics>({
        simulationAccuracy: 0, logicMethodology: 0, industrialOutput: 0,
        sensitivityAnalysis: 0, documentation: 0,
    });
    const [adminNotes, setAdminNotes] = useState('');
    const [notesOpen, setNotesOpen] = useState(true);

    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await fetchApi<{ submission: SubmissionDetail }>(`/api/admin/submissions/${submissionId}`);
                if (res.success && res.data) {
                    const sub = res.data.submission;
                    setSubmission(sub);
                    if (sub.gradeMetrics) setMetrics(sub.gradeMetrics);
                    if (sub.adminNotes) setAdminNotes(sub.adminNotes || '');
                } else {
                    setError(res.error?.message || 'Failed to load submission');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [submissionId]);

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const res = await fetchApi(`/api/admin/submissions/${submissionId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({ metrics, adminNotes }),
            });
            if (res.success) {
                setActionMsg({ type: 'success', text: 'Draft saved successfully.' });
            } else {
                setActionMsg({ type: 'error', text: res.error?.message || 'Save failed' });
            }
        } catch {
            setActionMsg({ type: 'error', text: 'Save failed' });
        } finally {
            setSaving(false);
            setTimeout(() => setActionMsg(null), 3000);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Approve this submission and generate a certificate?')) return;
        setApproving(true);
        try {
            // Save grades first, then approve
            await fetchApi(`/api/admin/submissions/${submissionId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({ metrics, adminNotes }),
            });
            const res = await approveSubmission(submissionId);
            if (res.success) {
                setActionMsg({ type: 'success', text: 'Submission approved! Certificate will be generated.' });
                setTimeout(() => router.push('/admin/submissions'), 2000);
            } else {
                setActionMsg({ type: 'error', text: res.error?.message || 'Approval failed' });
            }
        } catch {
            setActionMsg({ type: 'error', text: 'Approval failed' });
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            setActionMsg({ type: 'error', text: 'Admin notes / feedback are required before rejecting.' });
            return;
        }
        if (!confirm('Reject this submission? The student will be notified with your feedback.')) return;
        setRejecting(true);
        try {
            const res = await rejectSubmission(submissionId, adminNotes);
            if (res.success) {
                setActionMsg({ type: 'success', text: 'Submission rejected. Student has been notified.' });
                setTimeout(() => router.push('/admin/submissions'), 2000);
            } else {
                setActionMsg({ type: 'error', text: res.error?.message || 'Rejection failed' });
            }
        } catch {
            setActionMsg({ type: 'error', text: 'Rejection failed' });
        } finally {
            setRejecting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="flex flex-col items-center gap-3 h-96 justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-gray-600" style={poppins}>{error || 'Submission not found'}</p>
                <Link href="/admin/submissions" className="text-purple-600 text-sm hover:underline" style={poppins}>← Back to submissions</Link>
            </div>
        );
    }

    const finalGrade = calcFinalGrade(metrics);
    const gradeInfo = getGradeCategory(finalGrade);
    const metricsAllFilled = Object.values(metrics).every(v => v > 0);
    const isReviewed = ['approved', 'rejected'].includes(submission.reviewStatus);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/submissions" className="flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm transition-colors" style={poppins}>
                    <ArrowLeft className="w-4 h-4" /> Back to Submissions
                </Link>
                <div className="flex items-center gap-2 ml-auto">
                    {isReviewed && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${submission.reviewStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`} style={poppins}>
                            {submission.reviewStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* ── LEFT PANEL: Files & Identity ─── */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Student Info */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
                            <User className="w-5 h-5 text-purple-500" /> Student Information
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Student Name</p>
                                <p className="font-semibold text-gray-900" style={poppins}>{submission.enrollment.user.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Email</p>
                                <p className="font-semibold text-gray-900" style={poppins}>{submission.enrollment.user.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Course</p>
                                <p className="font-semibold text-gray-900" style={poppins}>{submission.enrollment.course.courseName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Submitted</p>
                                <p className="font-semibold text-gray-900" style={poppins}>
                                    {new Date(submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Verification */}
                    {submission.identity && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
                                <GraduationCap className="w-5 h-5 text-purple-500" /> Identity Verification
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Full Name (for certificate)</p>
                                    <p className="font-semibold text-gray-900" style={poppins}>{submission.identity.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs mb-0.5" style={poppins}>College / School</p>
                                    <p className="font-semibold text-gray-900" style={poppins}>{submission.identity.collegeName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Branch</p>
                                    <p className="font-semibold text-gray-900" style={poppins}>{submission.identity.branch}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Graduation Year</p>
                                    <p className="font-semibold text-gray-900" style={poppins}>{submission.identity.graduationYear}</p>
                                </div>
                            </div>
                            {submission.identity.collegeIdUrl && (
                                <a
                                    href={submission.identity.collegeIdUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs text-purple-600 hover:underline"
                                    style={poppins}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> View College ID Photo
                                </a>
                            )}
                        </div>
                    )}

                    {/* Submission Files */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
                            <FileText className="w-5 h-5 text-purple-500" /> Submitted Files
                        </h2>
                        <div className="space-y-3">
                            {submission.projectFileUrl && (
                                <a
                                    href={submission.projectFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                                        <Download className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800" style={poppins}>Project File</p>
                                        <p className="text-xs text-gray-400" style={poppins}>ZIP / PDF</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                </a>
                            )}
                            {submission.reportPdfUrl && (
                                <a
                                    href={submission.reportPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800" style={poppins}>Project Report</p>
                                        <p className="text-xs text-gray-400" style={poppins}>PDF</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Grading ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Grade Metrics */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
                            <Award className="w-5 h-5 text-purple-500" /> Grading Metrics
                        </h2>

                        <div className="space-y-5">
                            {METRICS.map(({ key, label, weight, description }) => (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800" style={poppins}>{label}</p>
                                            <p className="text-xs text-gray-400" style={poppins}>{description} · {Math.round(weight * 100)}% weight</p>
                                        </div>
                                    </div>
                                    <GradeSlider
                                        value={metrics[key]}
                                        onChange={v => setMetrics(prev => ({ ...prev, [key]: v }))}
                                        disabled={isReviewed}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Final Grade Display */}
                        <div className="mt-6 pt-5 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5" style={poppins}>Final Grade</p>
                                    <p className={`text-3xl font-bold ${gradeInfo.color}`} style={{ ...outfit, fontWeight: 800 }}>
                                        {finalGrade.toFixed(2)} <span className="text-lg text-gray-400">/ 5.00</span>
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${gradeInfo.color} bg-gray-50`} style={poppins}>
                                    {gradeInfo.label}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            onClick={() => setNotesOpen(o => !o)}
                        >
                            <h2 className="text-base font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>Admin Notes / Feedback</h2>
                            {notesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {notesOpen && (
                            <div className="px-6 pb-5">
                                <textarea
                                    rows={5}
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    disabled={isReviewed}
                                    placeholder="Provide detailed feedback for the student. Required before rejecting."
                                    maxLength={2000}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                    style={poppins}
                                />
                                <p className="text-xs text-gray-400 text-right mt-1" style={poppins}>{adminNotes.length}/2000</p>
                            </div>
                        )}
                    </div>

                    {/* Action Message */}
                    {actionMsg && (
                        <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm ${actionMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`} style={poppins}>
                            {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {actionMsg.text}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!isReviewed && (
                        <div className="space-y-3">
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition-all disabled:opacity-60"
                                style={{ ...poppins, fontWeight: 600 }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={rejecting || !adminNotes.trim()}
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm hover:bg-red-100 transition-all disabled:opacity-40"
                                    style={{ ...poppins, fontWeight: 600 }}
                                >
                                    {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reject
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approving || !metricsAllFilled}
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all disabled:opacity-40"
                                    style={{ ...poppins, fontWeight: 600 }}
                                >
                                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Approve
                                </button>
                            </div>
                            {!metricsAllFilled && (
                                <p className="text-xs text-gray-400 text-center" style={poppins}>Fill all 5 metrics to enable approval</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
