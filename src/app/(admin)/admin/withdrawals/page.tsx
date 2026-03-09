'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Wallet,
  Check,
  X,
  Eye,
  DollarSign
} from 'lucide-react';
import { getAdminWithdrawals, getAdminWithdrawalStats, processWithdrawal, completeWithdrawal, rejectWithdrawal, AdminWithdrawal, WithdrawalStats } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'processing' | 'completed' | 'rejected' | ''>('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [withsRes, statsRes] = await Promise.all([
        getAdminWithdrawals({ status: statusFilter || undefined, limit: 50 }),
        getAdminWithdrawalStats()
      ]);

      if (withsRes.success && withsRes.data) {
        setWithdrawals(withsRes.data.withdrawals);
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

  const handleProcess = async (id: string) => {
    setProcessing(id);
    try {
      await processWithdrawal(id);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (id: string) => {
    const txId = prompt('Enter transaction ID:');
    if (!txId) return;
    setProcessing(id);
    try {
      await completeWithdrawal(id, txId);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setProcessing(id);
    try {
      await rejectWithdrawal(id, reason);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Withdrawals</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Process withdrawal requests</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600" style={{ ...outfit, fontWeight: 800 }}>{stats.pendingCount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Pending</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-orange-600" style={{ ...outfit, fontWeight: 800 }}>₹{stats.pendingAmount}</p>
            <p className="text-sm text-gray-500" style={poppins}>Pending Amount</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-blue-600" style={{ ...outfit, fontWeight: 800 }}>{stats.processedToday}</p>
            <p className="text-sm text-gray-500" style={poppins}>Processed Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-green-600" style={{ ...outfit, fontWeight: 800 }}>₹{stats.processedAmountToday}</p>
            <p className="text-sm text-gray-500" style={poppins}>Processed Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>₹{stats.totalProcessed}</p>
            <p className="text-sm text-gray-500" style={poppins}>Total Processed</p>
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
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Withdrawals List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={poppins}>No withdrawal requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>UPI ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Requested</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={poppins}>{withdrawal.userName}</p>
                      <p className="text-xs text-gray-500" style={poppins}>{withdrawal.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900" style={poppins}>
                      ₹{withdrawal.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm" style={poppins}>
                      {withdrawal.upiId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`} style={poppins}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500" style={poppins}>
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcess(withdrawal.id)}
                              disabled={processing === withdrawal.id}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(withdrawal.id)}
                              disabled={processing === withdrawal.id}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'processing' && (
                          <button
                            onClick={() => handleComplete(withdrawal.id)}
                            disabled={processing === withdrawal.id}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
