'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Gift,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { getAdminReferrals, getAdminReferralStats, AdminReferral, ReferralStats } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | ''>('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [refsRes, statsRes] = await Promise.all([
        getAdminReferrals({ status: statusFilter || undefined, limit: 50 }),
        getAdminReferralStats()
      ]);

      if (refsRes.success && refsRes.data) {
        setReferrals(refsRes.data.referrals);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Referrals</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Track referral program performance</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{stats.totalReferrals}</p>
            <p className="text-sm text-gray-500" style={poppins}>Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{stats.completedReferrals}</p>
            <p className="text-sm text-gray-500" style={poppins}>Completed</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{stats.conversionRate}%</p>
            <p className="text-sm text-gray-500" style={poppins}>Conversion Rate</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>₹{stats.totalPayouts}</p>
            <p className="text-sm text-gray-500" style={poppins}>Total Payouts</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={poppins}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={poppins}>No referrals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Referrer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Referee</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Bonus</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Created</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Converted</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={poppins}>{ref.referrerName}</p>
                      <p className="text-xs text-gray-500" style={poppins}>{ref.referrerEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={poppins}>{ref.refereeName}</p>
                      <p className="text-xs text-gray-500" style={poppins}>{ref.refereeEmail}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600" style={poppins}>
                      ₹{ref.bonusAmount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        ref.status === 'completed' ? 'bg-green-100 text-green-700' :
                        ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`} style={poppins}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500" style={poppins}>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500" style={poppins}>
                      {ref.convertedAt ? new Date(ref.convertedAt).toLocaleDateString() : '-'}
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
