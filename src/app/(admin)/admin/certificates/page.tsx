'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Search, Loader2, Download, Award, FileText } from 'lucide-react';
import { getAdminCertificates, AdminCertificate } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, [search]);

  async function fetchCertificates() {
    setLoading(true);
    const res = await getAdminCertificates();
    if (res.success && res.data) {
      let items = res.data.certificates;
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(c =>
          c.studentName.toLowerCase().includes(q) ||
          c.studentEmail.toLowerCase().includes(q) ||
          c.courseName.toLowerCase().includes(q) ||
          c.certificateId.toLowerCase().includes(q)
        );
      }
      setCertificates(items);
    }
    setLoading(false);
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Certificates</h1>
          <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>View all issued course completion certificates</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
          <Award className="w-5 h-5 text-purple-600" />
          <span className="text-purple-700 font-semibold" style={poppins}>{certificates.length} issued</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, course, or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400" style={poppins}>No certificates issued yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Certificate ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Student</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Course</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Branch</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Issue Date</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-purple-600" style={poppins}>{cert.certificateId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900" style={poppins}>{cert.studentName}</p>
                        <p className="text-xs text-gray-500" style={poppins}>{cert.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={poppins}>{cert.courseName}</p>
                      <p className="text-xs text-gray-400" style={poppins}>{cert.courseId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700" style={poppins}>
                        {cert.branch || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>
                      {fmt(cert.issueDate)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/certificate/${cert.certificateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium transition-colors"
                        style={poppins}
                      >
                        <Download className="w-3.5 h-3.5" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}