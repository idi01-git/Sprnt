'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Wallet,
  Check,
  X,
  Eye,
  CreditCard,
  AlertCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import {
  getAdminWithdrawals,
  getAdminWithdrawalStats,
  processWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  AdminWithdrawal,
  WithdrawalStats,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

// ── 2-Step Processing Modal ────────────────────────────────────────────────
type ModalStep = 'reveal' | 'confirm' | 'reject_form';

function ProcessModal({
  withdrawal,
  onClose,
  onRefresh,
}: {
  withdrawal: AdminWithdrawal;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [step, setStep] = useState<ModalStep>('reveal');
  const [upiRevealed, setUpiRevealed] = useState(false);
  const [withdrawalUpiId, setWithdrawalUpiId] = useState<string | null>(null);
  const [txId, setTxId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProcessing = withdrawal.status === 'processing';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReveal = async () => {
    if (isProcessing) { setStep('confirm'); return; }
    setLoading(true);
    try {
      const res = await processWithdrawal(withdrawal.id);
      if (res.success && res.data) {
        setUpiRevealed(true);
        if (res.data.upiId) {
          setWithdrawalUpiId(res.data.upiId);
        }
        setStep('confirm');
        onRefresh();
      }
      else setError(res.error?.message || 'Failed to process');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (!txId.trim()) { setError('Transaction ID is required'); return; }
    if (!confirmed) { setError('Please tick the confirmation checkbox'); return; }
    setLoading(true);
    try {
      const res = await completeWithdrawal(withdrawal.id, txId.trim());
      if (res.success) { onRefresh(); onClose(); }
      else setError(res.error?.message || 'Failed to complete');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError('Reason is required'); return; }
    setLoading(true);
    try {
      const res = await rejectWithdrawal(withdrawal.id, rejectReason.trim());
      if (res.success) { onRefresh(); onClose(); }
      else setError(res.error?.message || 'Failed to reject');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
              {step === 'reject_form' ? 'Reject Withdrawal' : 'Process Withdrawal'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5" style={poppins}>
              {withdrawal.userName} · ₹{Number(withdrawal.amount).toFixed(2)}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1 — Reveal UPI */}
          {step === 'reveal' && (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800" style={poppins}>
                  Clicking <strong>"Process"</strong> will mark this request as <em>in processing</em> and reveal the student's UPI ID for manual transfer.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Student</p>
                  <p className="font-semibold text-gray-900" style={poppins}>{withdrawal.userName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-0.5" style={poppins}>Amount</p>
                  <p className="font-bold text-gray-900 text-lg" style={{ ...outfit, fontWeight: 800 }}>₹{Number(withdrawal.amount).toFixed(2)}</p>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm" style={poppins}>{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('reject_form')} className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors" style={{ ...poppins, fontWeight: 600 }}>
                  Reject
                </button>
                <button onClick={handleReveal} disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60" style={{ ...poppins, fontWeight: 600 }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Process & Reveal UPI
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Manual Transfer + Confirm */}
          {step === 'confirm' && (
            <>
              {/* UPI Box */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-green-600 mb-1.5" style={poppins}>Transfer ₹{Number(withdrawal.amount).toFixed(2)} to this UPI ID:</p>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-green-900 text-lg font-mono flex-1" style={poppins}>{withdrawalUpiId || withdrawal.upiId || 'Not available'}</p>
                  {(withdrawalUpiId || withdrawal.upiId) && (
                    <button onClick={() => copy((withdrawalUpiId || withdrawal.upiId)!)} className="p-2 rounded-lg bg-green-200/60 hover:bg-green-300 transition-colors">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-green-700" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
                  Transaction / UTR ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={e => { setTxId(e.target.value); setError(null); }}
                  placeholder="e.g. 428571234567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono"
                  style={poppins}
                />
              </div>

              {/* Confirm checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-purple-600 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed" style={poppins}>
                  I confirm that ₹{Number(withdrawal.amount).toFixed(2)} has been successfully transferred to the student's UPI ID and the transaction ID above is correct.
                </span>
              </label>

              {error && <p className="text-red-600 text-sm" style={poppins}>{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep('reject_form')} className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50" style={{ ...poppins, fontWeight: 600 }}>
                  Reject
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || !txId || !confirmed}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark as Completed
                </button>
              </div>
            </>
          )}

          {/* Reject Form */}
          {step === 'reject_form' && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-700" style={poppins}>
                  The student will be notified with your reason. The amount will be returned to their wallet balance.
                </p>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ ...poppins, fontWeight: 600, color: '#374151' }}>
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => { setRejectReason(e.target.value); setError(null); }}
                  placeholder="e.g. UPI ID is invalid, please update your UPI ID and try again."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  style={poppins}
                />
              </div>
              {error && <p className="text-red-600 text-sm" style={poppins}>{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('reveal')} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={{ ...poppins, fontWeight: 600 }}>
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Reject Request
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const statusConfig = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'processing' | 'completed' | 'rejected' | ''>('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [withsRes, statsRes] = await Promise.all([
        getAdminWithdrawals({ status: statusFilter || undefined, limit: 50 }),
        getAdminWithdrawalStats(),
      ]);
      if (withsRes.success && withsRes.data) setWithdrawals(withsRes.data.withdrawals);
      if (statsRes.success && statsRes.data) setStats(statsRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Pending', value: stats.pendingCount ?? 0, color: 'text-yellow-600' },
    { label: 'Pending Amount', value: `₹${Number(stats.pendingAmount ?? 0).toFixed(0)}`, color: 'text-orange-600' },
    { label: 'Processed Today', value: stats.processedToday ?? 0, color: 'text-blue-600' },
    { label: 'Amount Today', value: `₹${Number(stats.processedAmountToday ?? 0).toFixed(0)}`, color: 'text-green-600' },
    { label: 'Total Processed', value: `₹${Number(stats.totalProcessed ?? 0).toFixed(0)}`, color: 'text-gray-900' },
  ] : [];

  return (
    <div>
      {selectedWithdrawal && (
        <ProcessModal
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onRefresh={() => { fetchData(); setSelectedWithdrawal(null); }}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Withdrawals</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Process student withdrawal requests</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statCards.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className={`text-2xl font-bold ${c.color}`} style={{ ...outfit, fontWeight: 800 }}>{c.value}</p>
              <p className="text-sm text-gray-500" style={poppins}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6 flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          style={poppins}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        {stats && stats.pendingCount > 0 && (
          <span className="ml-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold" style={poppins}>
            {stats.pendingCount} pending action{stats.pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={poppins}>No withdrawal requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Amount', 'UPI ID', 'Status', 'Requested', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => {
                  const st = statusConfig[w.status] || statusConfig.pending;
                  const actionable = w.status === 'pending' || w.status === 'processing';
                  return (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm" style={poppins}>{w.userName}</p>
                        <p className="text-xs text-gray-500" style={poppins}>{w.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900" style={poppins}>₹{Number(w.amount).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        {w.status === 'processing' && w.upiId ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-700">{w.upiId}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-mono">{w.status === 'pending' ? '••••••••' : w.upiId || '–'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`} style={poppins}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm" style={poppins}>
                        {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        {actionable ? (
                          <button
                            onClick={() => setSelectedWithdrawal(w)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${w.status === 'processing'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            style={poppins}
                          >
                            {w.status === 'processing' ? <Check className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {w.status === 'processing' ? 'Complete' : 'Process'}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs" style={poppins}>–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
