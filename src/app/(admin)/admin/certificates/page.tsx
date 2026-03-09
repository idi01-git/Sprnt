'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getAdminCertificates, getAdminCertificateStats, revokeCertificate, AdminCertificate, CertificateStats } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'valid' | 'revoked' | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certsRes, statsRes] = await Promise.all([
        getAdminCertificates({ search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 }),
        getAdminCertificateStats()
      ]);

      if (certsRes.success && certsRes.data) {
        setCertificates(certsRes.data.certificates);
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

  const handleRevoke = async (certId: string) => {
    const reason = prompt('Enter reason for revocation:');
    if (!reason) return;
    try {
      await revokeCertificate(certId, reason);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Certificates</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Manage issued certificates</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{stats.totalIssued}</p>
            <p className="text-sm text-gray-500" style={poppins}>Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-green-600" style={{ ...outfit, fontWeight: 800 }}>{stats.validCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Valid</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-red-600" style={{ ...outfit, fontWeight: 800 }}>{stats.revokedCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Revoked</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-purple-600" style={{ ...outfit, fontWeight: 800 }}>{stats.distinctionCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Distinction</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-blue-600" style={{ ...outfit, fontWeight: 800 }}>{stats.firstClassCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>First Class</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-600" style={{ ...outfit, fontWeight: 800 }}>{stats.passCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Pass</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or certificate ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={poppins}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          >
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Certificates List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={poppins}>No certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Certificate ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Student</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Course</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Grade</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Issued</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600" style={poppins}>
                      {cert.certificateId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900" style={poppins}>
                      {cert.userName}
                    </td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>
                      {cert.courseName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700" style={poppins}>
                        {cert.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cert.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={poppins}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500" style={poppins}>
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {cert.status === 'valid' && (
                        <button
                          onClick={() => handleRevoke(cert.certificateId)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </button>
                      )}
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
