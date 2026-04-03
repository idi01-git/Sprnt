'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  Loader2,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getWalletBalance, getTransactions, requestWithdrawal, getUserWithdrawals, WalletBalance, Transaction, UserWithdrawal } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const txTypeLabels: Record<string, string> = {
  referral_bonus: 'Referral Bonus',
  withdrawal: 'Withdrawal',
  earning: 'Earning',
};

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawals, setShowWithdrawals] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes, withdrawRes] = await Promise.all([
          getWalletBalance(),
          getTransactions(1, 20),
          getUserWithdrawals(),
        ]);

        if (walletRes.error?.code === 'AUTH_SESSION_EXPIRED' || walletRes.error?.code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Please log in to view your wallet.');
          setLoading(false);
          return;
        }

        if (!walletRes.success) {
          setError(walletRes.error?.message || 'Failed to load wallet');
          setLoading(false);
          return;
        }

        if (walletRes.success && walletRes.data) {
          setBalance(walletRes.data.wallet);
        }

        if (txRes.success && txRes.data) {
          setTransactions(Array.isArray(txRes.data.transactions) ? txRes.data.transactions : []);
        }

        if (withdrawRes.success && withdrawRes.data) {
          setWithdrawals(Array.isArray(withdrawRes.data.withdrawals) ? withdrawRes.data.withdrawals : []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMsg(null);

    try {
      const response = await requestWithdrawal({
        amount: parseFloat(withdrawAmount),
        upiId,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Withdrawal failed');
      }

      setWithdrawMsg('Withdrawal request submitted! You\'ll receive the amount within 48 hours.');
      setUpiId('');
      setWithdrawAmount('');

      const walletRes = await getWalletBalance();
      if (walletRes.success && walletRes.data) {
        setBalance(walletRes.data.wallet);
      }
    } catch (err: any) {
      setWithdrawMsg(`Error: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-4 w-24 bg-gray-100 rounded mb-6" />
          <div className="h-9 w-36 bg-gray-200 rounded-lg mb-8" />
          {/* Balance hero skeleton */}
          <div className="bg-gray-200 rounded-2xl h-36 mb-8" />
          {/* Content grid skeleton */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-20 bg-gray-100 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl" />
                </div>
              ))}
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-2xl h-40" />
              <div className="bg-white rounded-2xl p-5 border border-gray-100 h-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-500" style={poppins}>{error}</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white" style={{ ...poppins, fontWeight: 600 }}>Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8" style={{ ...outfit, fontWeight: 800 }}>
          My Wallet
        </h1>

        <div className="bg-linear-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
          <p className="text-white/70 text-sm mb-1" style={poppins}>Available Balance</p>
          <p className="text-4xl md:text-5xl" style={{ ...outfit, fontWeight: 800 }}>₹{(balance?.totalBalance ?? 0).toFixed(2)}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-white/50 text-xs" style={poppins}>Available</p>
              <p className="text-white font-semibold" style={poppins}>₹{(balance?.availableBalance ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs" style={poppins}>Locked (Pending)</p>
              <p className="text-white font-semibold" style={poppins}>₹{(balance?.lockedAmount ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Pending Withdrawal Status Banner */}
        {balance?.hasPendingWithdrawal && balance.pendingWithdrawal && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 mb-0.5" style={{ ...poppins, fontWeight: 700 }}>
                Withdrawal Request Pending
              </p>
                <p className="text-sm text-amber-700" style={poppins}>
                  ₹{Number(balance.pendingWithdrawal?.amount ?? 0).toFixed(2)} — requested on{' '}
                  {balance.pendingWithdrawal?.requestedAt
                    ? new Date(balance.pendingWithdrawal.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'N/A'}
                </p>
              <p className="text-xs text-amber-600 mt-1" style={poppins}>
                Processing time: 24–48 hours. You'll receive a notification once it's completed.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-200 text-amber-800 font-semibold shrink-0" style={poppins}>
              Processing
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <ArrowUpRight className="w-5 h-5 text-purple-600" /> Withdraw Funds
            </h2>

            {balance?.hasPendingWithdrawal ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600" style={poppins}>
                  A withdrawal request is already in progress. You can submit a new one once this is processed.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-5">

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ ...poppins, fontWeight: 600 }}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    required
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    style={poppins}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ ...poppins, fontWeight: 600 }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    required
                    min="100"
                    max={balance?.availableBalance ?? undefined}
                    placeholder="Min ₹100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    style={poppins}
                  />
                </div>

                {withdrawMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${withdrawMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                    }`} style={poppins}>
                    {withdrawMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing || (balance?.availableBalance ?? 0) < 100}
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {withdrawing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Withdraw to UPI</>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-purple-900 mb-3" style={{ ...outfit, fontWeight: 700 }}>
                How it works
              </h3>
              <ul className="space-y-2.5 text-sm text-purple-700" style={poppins}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  Earn ₹50 for each successful referral
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  Credits are added automatically when your friend enrolls
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  Minimum withdrawal: ₹100
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  Withdrawals processed within 48 hours
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard/referrals"
              className="block bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900" style={poppins}>Earn more credits</p>
                  <p className="text-xs text-gray-500 mt-0.5" style={poppins}>Share your referral code with friends</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 700 }}>
              Activity
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawals(false)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showWithdrawals ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={poppins}
              >
                Transactions
              </button>
              <button
                onClick={() => setShowWithdrawals(true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showWithdrawals ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={poppins}
              >
                My Withdrawals ({withdrawals?.length || 0})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          ) : !showWithdrawals ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400" style={poppins}>No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div key={tx.id} className={`flex items-center justify-between p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'withdrawal' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                        <ArrowUpRight className={`w-5 h-5 ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900" style={poppins}>
                          {txTypeLabels[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-gray-500" style={poppins}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                        }`} style={poppins}>
                        {tx.type === 'withdrawal' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-green-50 text-green-700' : tx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`} style={{ ...poppins, fontWeight: 500 }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="text-center py-10">
                  <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400" style={poppins}>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {withdrawals.map((w) => {
                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
                      processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
                      completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
                      rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
                    };
                    const st = statusConfig[w.status] || statusConfig.pending;
                    return (
                      <div key={w.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-lg font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
                              ₹{Number(w.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500" style={poppins}>
                              Requested on {new Date(w.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`} style={poppins}>
                            {st.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-xs text-gray-500 mb-0.5" style={poppins}>UPI ID</p>
                            <p className="font-mono text-gray-800 text-xs" style={poppins}>{w.upiId || '—'}</p>
                          </div>
                          {w.transactionId && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-xs text-gray-500 mb-0.5" style={poppins}>UTR / Transaction ID</p>
                              <p className="font-mono text-gray-800 text-xs" style={poppins}>{w.transactionId}</p>
                            </div>
                          )}
                          {w.processedAt && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-xs text-gray-500 mb-0.5" style={poppins}>Processed On</p>
                              <p className="text-gray-800 text-xs" style={poppins}>{new Date(w.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          )}
                        </div>
                        {w.rejectionReason && (
                          <div className="mt-2.5 bg-red-50 border border-red-100 rounded-lg p-2.5">
                            <p className="text-xs text-red-600 font-medium" style={poppins}>Rejection Reason: {w.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
