'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  Gift,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  Share2
} from 'lucide-react';
import { getReferralStats, getReferrals, getReferralCode, ReferralStats, Referral, fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function ReferralsPage() {
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [codeRes, statsRes, listRes] = await Promise.all([
          getReferralCode(),
          getReferralStats(),
          getReferrals(1, 20),
        ]);

        if (codeRes.error?.code === 'AUTH_SESSION_EXPIRED' || codeRes.error?.code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Please log in to view your referrals.');
          setLoading(false);
          return;
        }

        if (!codeRes.success && codeRes.error) {
          setError(codeRes.error.message || 'Failed to load referral data');
          setLoading(false);
          return;
        }

        if (codeRes.success && codeRes.data) {
          setCode(codeRes.data.code);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          setShareUrl(`${baseUrl}?ref=${codeRes.data.code}`);
        }
        
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data.stats);
        }
        
        if (listRes.success && listRes.data) {
          setReferrals(listRes.data.referrals);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Link href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white" style={{ ...poppins, fontWeight: 600 }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Referred', value: stats?.totalReferred ?? 0, color: 'from-blue-500 to-cyan-500' },
    { icon: Check, label: 'Completed', value: stats?.completedReferrals ?? 0, color: 'from-green-500 to-emerald-500' },
    { icon: TrendingUp, label: 'Earnings', value: `₹${stats?.totalEarnings ?? 0}`, color: 'from-purple-500 to-pink-500' },
    { icon: Wallet, label: 'Conversion Rate', value: `${stats && stats.totalReferred > 0 ? Math.round((stats.completedReferrals / stats.totalReferred) * 100) : 0}%`, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
          Referral Program
        </h1>
        <p className="text-gray-500 mb-8" style={{ ...poppins, fontSize: '15px' }}>
          Earn ₹50 for every friend who enrolls using your referral code!
        </p>

        {code && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white mb-8">
            <p className="text-white/70 text-sm mb-2" style={{ ...poppins, fontWeight: 500 }}>Your Referral Code</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl tracking-widest" style={{ ...outfit, fontWeight: 800 }}>
                  {code}
                </span>
                <button
                  onClick={() => handleCopy(code)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={() => handleCopy(shareUrl)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 text-sm hover:shadow-lg transition-all"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <Share2 className="w-4 h-4" /> Copy Share Link
              </button>
            </div>
            <p className="text-white/60 text-xs mt-3" style={poppins}>{shareUrl}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5" style={poppins}>{card.label}</p>
              </div>
            );
          })}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>
          Referral History
        </h2>
        {(!referrals || referrals.length === 0) ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm" style={poppins}>No referrals yet. Share your code to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map(ref => (
              <div key={ref.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900" style={poppins}>{ref.referredUserEmail}</p>
                  <p className="text-xs text-gray-400" style={poppins}>
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${ref.status === 'completed' ? 'bg-green-50 text-green-700' : ref.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'
                    }`} style={{ ...poppins, fontWeight: 600 }}>
                    {ref.status}
                  </span>
                  {ref.bonusAmount > 0 && (
                    <p className="text-sm font-bold text-gray-900 mt-1" style={poppins}>₹{ref.bonusAmount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
