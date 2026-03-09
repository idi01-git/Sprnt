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
import { getWalletBalance, getTransactions, requestWithdrawal, WalletBalance, Transaction } from '@/lib/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes] = await Promise.all([
          getWalletBalance(),
          getTransactions(1, 20),
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
          setTransactions(txRes.data.transactions);
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
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-500" style={poppins}>{error}</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white" style={{ ...poppins, fontWeight: 600 }}>Back</Link>
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

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
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

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <ArrowUpRight className="w-5 h-5 text-purple-600" /> Withdraw Funds
            </h2>

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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ ...poppins, fontWeight: 600 }}
              >
                {withdrawing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Withdraw to UPI</>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-purple-900 mb-3" style={{ ...outfit, fontWeight: 700 }}>
                How it works
              </h3>
              <ul className="space-y-2.5 text-sm text-purple-700" style={poppins}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Earn ₹50 for each successful referral
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Credits are added automatically when your friend enrolls
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Minimum withdrawal: ₹100
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
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

        {transactions && transactions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>
              Recent Transactions
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {transactions.map((tx, i) => (
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
                      {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-green-50 text-green-700' : tx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`} style={{ ...poppins, fontWeight: 500 }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
