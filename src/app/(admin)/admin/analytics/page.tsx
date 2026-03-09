'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { getAdminRevenueChart, getAdminSignupsChart, RevenueData, SignupData } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [signupData, setSignupData] = useState<SignupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revenueRes, signupRes] = await Promise.all([
        getAdminRevenueChart(days),
        getAdminSignupsChart(days)
      ]);

      if (revenueRes.success && revenueRes.data) {
        const chartData = (revenueRes.data as unknown as { chart: RevenueData[] }).chart;
        setRevenueData(chartData || []);
      }
      if (signupRes.success && signupRes.data) {
        const chartData = (signupRes.data as unknown as { chart: SignupData[] }).chart;
        setSignupData(chartData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const maxSignups = Math.max(...signupData.map(d => d.newUsers), 1);
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalSignups = signupData.reduce((sum, d) => sum + d.newUsers, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Analytics</h1>
          <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Platform performance insights</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={poppins}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>₹{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500" style={poppins}>Total Revenue</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{totalSignups}</p>
              <p className="text-sm text-gray-500" style={poppins}>Total Signups</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>₹{Math.round(totalRevenue / (days || 1)).toLocaleString()}</p>
              <p className="text-sm text-gray-500" style={poppins}>Avg Daily Revenue</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{Math.round(totalSignups / (days || 1))}</p>
              <p className="text-sm text-gray-500" style={poppins}>Avg Daily Signups</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ ...outfit, fontWeight: 700 }}>Revenue Trend</h2>
            <div className="h-64 flex items-end gap-1">
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t"
                    style={{ height: `${(d.revenue / maxRevenue) * 200}px` }}
                  />
                  <span className="text-xs text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signups Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ ...outfit, fontWeight: 700 }}>User Signups</h2>
            <div className="h-64 flex items-end gap-1">
              {signupData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                    style={{ height: `${(d.newUsers / maxSignups) * 200}px` }}
                  />
                  <span className="text-xs text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
