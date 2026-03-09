'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Search, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function VerifyCertificatePage() {
    const [certId, setCertId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        valid: boolean;
        studentName?: string;
        courseName?: string;
        grade?: string;
        issueDate?: string;
        message?: string;
    } | null>(null);

    const handleVerify = async () => {
        const trimmed = certId.trim();
        if (!trimmed) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`/api/certificates/${trimmed}/verify`);
            const data = await res.json().catch(() => null);

            if (res.ok && data?.success && data?.data) {
                const cert = data.data;
                if (cert.isRevoked) {
                    setResult({ valid: false, message: 'This certificate has been revoked.' });
                } else {
                    setResult({
                        valid: true,
                        studentName: cert.studentName,
                        courseName: cert.courseName,
                        grade: cert.gradeCategory,
                        issueDate: cert.issuedAt
                            ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                            : undefined,
                    });
                }
            } else {
                setResult({ valid: false, message: data?.error?.message || 'Certificate not found. Please check the ID and try again.' });
            }
        } catch {
            setResult({ valid: false, message: 'Could not reach the server. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white pt-24 pb-20 px-6">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                        <Award className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ ...outfit, fontWeight: 800 }}>
                        Verify Certificate
                    </h1>
                    <p className="text-gray-500 text-lg" style={{ ...poppins, fontWeight: 400 }}>
                        Enter a Sprintern certificate ID to verify its authenticity.
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={poppins}>
                        Certificate ID
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="e.g. SPRT-2025-XXXX"
                            value={certId}
                            onChange={(e) => setCertId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && handleVerify()}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-gray-900"
                            style={{ ...poppins, fontSize: '14px' }}
                        />
                        <button
                            onClick={handleVerify}
                            disabled={loading || !certId.trim()}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ ...poppins, fontWeight: 600, fontSize: '14px' }}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Verify
                        </button>
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <div className={`rounded-2xl border p-6 ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        {result.valid ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-7 h-7 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-green-800 text-lg" style={{ ...outfit, fontWeight: 800 }}>
                                            ✓ Certificate Verified
                                        </p>
                                        <p className="text-green-600 text-sm" style={poppins}>This is an authentic Sprintern certificate.</p>
                                    </div>
                                </div>
                                <div className="grid gap-2 mt-2">
                                    {result.studentName && (
                                        <div className="flex justify-between text-sm" style={poppins}>
                                            <span className="text-gray-500 font-medium">Student Name</span>
                                            <span className="text-gray-900 font-semibold">{result.studentName}</span>
                                        </div>
                                    )}
                                    {result.courseName && (
                                        <div className="flex justify-between text-sm" style={poppins}>
                                            <span className="text-gray-500 font-medium">Course</span>
                                            <span className="text-gray-900 font-semibold">{result.courseName}</span>
                                        </div>
                                    )}
                                    {result.grade && (
                                        <div className="flex justify-between text-sm" style={poppins}>
                                            <span className="text-gray-500 font-medium">Grade</span>
                                            <span className="text-green-700 font-semibold">{result.grade}</span>
                                        </div>
                                    )}
                                    {result.issueDate && (
                                        <div className="flex justify-between text-sm" style={poppins}>
                                            <span className="text-gray-500 font-medium">Issued On</span>
                                            <span className="text-gray-900 font-semibold">{result.issueDate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <XCircle className="w-7 h-7 text-red-500 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-red-700 text-lg" style={{ ...outfit, fontWeight: 800 }}>
                                        ✗ Not Verified
                                    </p>
                                    <p className="text-red-600 text-sm" style={poppins}>{result.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-all"
                        style={poppins}
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
