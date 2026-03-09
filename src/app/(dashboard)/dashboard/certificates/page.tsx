'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Award,
    Download,
    Loader2,
    AlertCircle,
    ArrowLeft,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Search,
    Calendar,
    BookOpen,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface Certificate {
    id: string;
    certificateNumber: string;
    studentName: string;
    courseName: string;
    gradeCategory: string;
    finalGrade: number | null;
    issuedAt: string;
    isRevoked: boolean;
    downloadUrl?: string;
    previewUrl?: string;
}

const gradeStyles: Record<string, { bg: string; text: string; border: string }> = {
    Distinction: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'First Class': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Pass: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    Fail: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            setLoading(true);
            try {
                const res = await fetchApi<{ certificates: Certificate[] }>('/api/certificates');
                if (res.success && res.data) {
                    setCertificates(res.data.certificates);
                } else {
                    setError(res.error?.message || 'Failed to load certificates');
                }
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    const handleDownload = async (certId: string) => {
        setDownloadingId(certId);
        try {
            const res = await fetchApi<{ url: string }>(`/api/certificates/${certId}/download`);
            if (res.success && res.data?.url) {
                window.open(res.data.url, '_blank');
            }
        } catch {
            // silent
        } finally {
            setDownloadingId(null);
        }
    };

    const filtered = certificates.filter(
        (c) =>
            c.courseName.toLowerCase().includes(search.toLowerCase()) ||
            c.certificateNumber.toLowerCase().includes(search.toLowerCase()),
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    <p className="text-gray-500 text-sm" style={poppins}>Loading certificates…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                    <p className="text-gray-600" style={poppins}>{error}</p>
                    <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm" style={{ ...poppins, fontWeight: 600 }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6 transition-colors" style={{ ...poppins, fontWeight: 500 }}>
                    <ArrowLeft className="w-4 h-4" /> My Learning
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1" style={{ ...outfit, fontWeight: 800 }}>
                            My Certificates
                        </h1>
                        <p className="text-gray-500 text-sm" style={poppins}>
                            {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
                        </p>
                    </div>

                    {certificates.length > 0 && (
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search certificates…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                style={poppins}
                            />
                        </div>
                    )}
                </div>

                {/* Empty state */}
                {certificates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-6">
                            <Award className="w-10 h-10 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                            No Certificates Yet
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xs mb-6" style={poppins}>
                            Complete a course, submit your project, and earn your verified certificate!
                        </p>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                            style={{ ...poppins, fontWeight: 600 }}
                        >
                            <BookOpen className="w-4 h-4" /> Browse Courses
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm" style={poppins}>No certificates match your search.</p>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {filtered.map((cert) => {
                            const grade = gradeStyles[cert.gradeCategory] ?? gradeStyles['Pass'];
                            const issueDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            });
                            return (
                                <div
                                    key={cert.id}
                                    className={`bg-white rounded-2xl border ${cert.isRevoked ? 'border-red-200' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all overflow-hidden`}
                                >
                                    {/* Top accent bar */}
                                    <div className={`h-1.5 w-full ${cert.isRevoked ? 'bg-red-400' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`} />

                                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${cert.isRevoked ? 'bg-red-50' : 'bg-gradient-to-br from-purple-100 to-blue-100'}`}>
                                            {cert.isRevoked ? (
                                                <XCircle className="w-7 h-7 text-red-400" />
                                            ) : (
                                                <Award className="w-7 h-7 text-purple-600" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h2 className="text-lg font-bold text-gray-900 truncate" style={{ ...outfit, fontWeight: 700 }}>
                                                    {cert.courseName}
                                                </h2>
                                                {cert.isRevoked ? (
                                                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold" style={poppins}>
                                                        Revoked
                                                    </span>
                                                ) : (
                                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${grade.bg} ${grade.text} ${grade.border}`} style={poppins}>
                                                        {cert.gradeCategory}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500" style={poppins}>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    ID: {cert.certificateNumber}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Issued {issueDate}
                                                </span>
                                                {cert.finalGrade !== null && (
                                                    <span className="flex items-center gap-1">
                                                        Grade: {cert.finalGrade.toFixed(2)} / 5.00
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {!cert.isRevoked && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link
                                                    href={`/verify/${cert.certificateNumber}`}
                                                    target="_blank"
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 hover:border-purple-300 hover:text-purple-600 transition-all"
                                                    style={{ ...poppins, fontWeight: 500 }}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Verify
                                                </Link>
                                                <button
                                                    onClick={() => handleDownload(cert.id)}
                                                    disabled={downloadingId === cert.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                                                    style={{ ...poppins, fontWeight: 600 }}
                                                >
                                                    {downloadingId === cert.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                    Download
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
