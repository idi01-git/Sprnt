'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Award,
  Loader2,
  AlertCircle,
  Calendar,
  BookOpen,
  GraduationCap,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { verifyCertificate, Certificate } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface CertificateData {
  certificateId: string;
  studentName: string;
  collegeName: string | null;
  courseName: string;
  branch: string;
  grade: string;
  issuedAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateId = params.certificateId as string;
  
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) return;

    const fetchCert = async () => {
      setLoading(true);
      try {
        const response = await verifyCertificate(certificateId);

        if (!response.success) {
          throw new Error(response.error?.message || 'Certificate not found');
        }

        if (response.data) {
          setValid(response.data.valid);
          if (response.data.certificate) {
            setCert({
              certificateId: response.data.certificate.certificateId,
              studentName: response.data.certificate.studentName,
              collegeName: null,
              courseName: response.data.certificate.courseName,
              branch: '',
              grade: '',
              issuedAt: response.data.certificate.issueDate,
              isRevoked: false,
              revokedAt: null,
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-gradient-to-b from-purple-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500" style={{ ...poppins, fontWeight: 500 }}>Verifying certificate…</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center mx-6">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2" style={{ ...outfit, fontWeight: 800 }}>
            Certificate Not Found
          </h2>
          <p className="text-gray-500 mb-6" style={{ ...poppins, fontSize: '14px' }}>
            {error || 'This certificate ID does not exist in our records.'}
          </p>
          <p className="text-xs text-gray-400 mb-4" style={poppins}>
            ID: {certificateId}
          </p>
          <Link href="/" className="text-purple-600 text-sm hover:underline" style={{ ...poppins, fontWeight: 600 }}>
            Go to Sprintern Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center pt-24 pb-16 px-6 ${valid ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'
      }`}>
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          {valid ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-100 text-green-700" style={{ ...poppins, fontWeight: 700 }}>
              <Shield className="w-5 h-5" />
              Verified & Authentic
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-100 text-red-700" style={{ ...poppins, fontWeight: 700 }}>
              <ShieldAlert className="w-5 h-5" />
              Certificate Revoked
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className={`h-2 ${valid ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`} />

          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2" style={{ ...poppins, fontWeight: 600 }}>
                Certificate of Completion
              </p>
              <h2 className="text-3xl bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent" style={{ ...outfit, fontWeight: 800 }}>
                Sprintern
              </h2>
            </div>

            <div className="space-y-5 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1" style={poppins}>Awarded to</p>
                <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                  {cert.studentName}
                </p>
                {cert.collegeName && (
                  <p className="text-sm text-gray-500 mt-1" style={poppins}>{cert.collegeName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1" style={poppins}>
                    <BookOpen className="w-3.5 h-3.5" /> Course
                  </div>
                  <p className="text-sm font-semibold text-gray-900" style={poppins}>{cert.courseName}</p>
                  <p className="text-xs text-gray-500" style={poppins}>{cert.branch}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1" style={poppins}>
                    <GraduationCap className="w-3.5 h-3.5" /> Grade
                  </div>
                  <p className="text-sm font-semibold text-gray-900" style={poppins}>{cert.grade}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4" style={poppins}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued: {new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span>ID: {cert.certificateId}</span>
              </div>
            </div>

            {cert.isRevoked && cert.revokedAt && (
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-red-600 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                  This certificate was revoked on {new Date(cert.revokedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4" style={poppins}>
          Verified by Sprintern · {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
