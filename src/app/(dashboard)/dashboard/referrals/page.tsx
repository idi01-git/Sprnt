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
  Share2,
  MessageCircle,
  Lock,
  BookOpen,
  Clock,
} from 'lucide-react';
import { getReferralStats, getReferrals, getReferralCode, ReferralStats, Referral, fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

/** Calculate days until approval, minimum 1 day if in the future */
function getDaysUntilApproval(autoApproveAt: string): number {
  const now = new Date();
  const approvalDate = new Date(autoApproveAt);
  const diffTime = approvalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // First check if user is eligible (has at least one enrollment)
        const codeRes = await getReferralCode();

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

        // Check if user is eligible (has enrollment and code is returned)
        const refCode = codeRes.data?.code;
        const hasEnrollment = codeRes.data?.isActive === true && refCode;

        if (hasEnrollment && refCode) {
          // User is eligible - set code and fetch additional data
          setIsEligible(true);
          setCode(refCode);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const url = `${baseUrl}?ref=${refCode}`;
          setShareUrl(url);
          setShareMessage(
            `🎓 I'm learning industry skills at Sprintern! Use my referral code ${refCode} and get ₹50 off.\n\nEnroll here: ${url}`
          );

          // Fetch stats and referrals list in parallel
          const [statsRes, listRes] = await Promise.all([
            getReferralStats(),
            getReferrals(1, 20),
          ]);

          if (statsRes.success && statsRes.data) {
            setStats(statsRes.data.stats);
          }

          if (listRes.success && listRes.data) {
            setReferrals(listRes.data.referrals ?? []);
          }
        } else {
          // User not eligible - show locked page
          setIsEligible(false);
          setCode(null);
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
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-4 w-24 bg-gray-100 rounded mb-6" />
          <div className="h-9 w-56 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
          {/* Code card skeleton */}
          <div className="h-40 bg-gray-200 rounded-2xl mb-8" />
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
                <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          {/* List skeleton */}
          <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
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
          <Link href="/" className="px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white" style={{ ...poppins, fontWeight: 600 }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Referred', value: stats?.totalReferred ?? 0, color: 'from-blue-500 to-cyan-500' },
    { icon: Check, label: 'Completed', value: stats?.completedReferrals ?? 0, color: 'from-green-500 to-emerald-500' },
    { icon: TrendingUp, label: 'Total Earned', value: `₹${stats?.totalEarnings ?? 0}`, color: 'from-purple-500 to-pink-500' },
    { icon: Wallet, label: 'Conversion Rate', value: `${stats && stats.totalReferred > 0 ? Math.round((stats.completedReferrals / stats.totalReferred) * 100) : 0}%`, color: 'from-orange-500 to-red-500' },
  ];

  // User hasn't enrolled in any course yet - show locked/early page
  if (!isEligible) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
            <ArrowLeft className="w-4 h-4" /> My Learning
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
            Referral Program
          </h1>
          <p className="text-gray-500 mb-10" style={{ ...poppins, fontSize: '15px' }}>
            Earn ₹50 for every friend who enrolls using your referral code!
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-linear-to-r from-purple-600 to-blue-600" />
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                Enroll in a Course to Unlock
              </h2>
              <p className="text-gray-500 text-sm max-w-xs mb-6" style={poppins}>
                Your unique referral code will be generated after your first course purchase. Start earning ₹50 per referral!
              </p>
              <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8 text-center">
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-purple-700" style={{ ...outfit, fontWeight: 800 }}>₹50</p>
                  <p className="text-xs text-purple-600" style={poppins}>per referral</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-700" style={{ ...outfit, fontWeight: 800 }}>₹100</p>
                  <p className="text-xs text-blue-600" style={poppins}>min withdrawal</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-700" style={{ ...outfit, fontWeight: 800 }}>∞</p>
                  <p className="text-xs text-green-600" style={poppins}>no limit</p>
                </div>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <BookOpen className="w-4 h-4" /> Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Referral Code Card */}
        <div className="bg-linear-to-r from-purple-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white mb-8">
          <p className="text-white/70 text-sm mb-2" style={{ ...poppins, fontWeight: 500 }}>Your Referral Code</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl tracking-widest" style={{ ...outfit, fontWeight: 800 }}>
                {code}
              </span>
              <button
                onClick={() => handleCopy(code!)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCopy(shareUrl)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-700 text-sm hover:shadow-lg transition-all"
              style={{ ...poppins, fontWeight: 600 }}
            >
              <Share2 className="w-4 h-4" /> Copy Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm hover:bg-green-400 hover:shadow-lg transition-all"
              style={{ ...poppins, fontWeight: 600 }}
            >
              <MessageCircle className="w-4 h-4" /> Share on WhatsApp
            </a>
          </div>
          <p className="text-white/50 text-xs mt-3" style={poppins}>{shareUrl}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5" style={poppins}>{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-purple-50 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-bold text-purple-900 mb-3" style={{ ...outfit, fontWeight: 700 }}>How it works</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', text: 'Share your unique referral code with friends' },
              { step: '2', text: 'Friend enrolls using your code and pays' },
              { step: '3', text: 'You earn ₹50 automatically in your wallet' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5" style={poppins}>
                  {item.step}
                </div>
                <p className="text-sm text-purple-800" style={poppins}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
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
                  {ref.status === 'pending' && ref.autoApproveAt && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1" style={poppins}>
                      <Clock className="w-3 h-3" />
                      ~{getDaysUntilApproval(ref.autoApproveAt)} days to confirm
                    </p>
                  )}
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
