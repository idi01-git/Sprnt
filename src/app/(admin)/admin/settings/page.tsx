'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader2,
  Shield,
  DollarSign,
  Bell,
  Palette
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface SystemSetting {
  settingKey: string;
  settingValue: unknown;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<SystemSetting[]>('/api/admin/settings');
      if (res.success && res.data) {
        const settingsMap: Record<string, unknown> = {};
        res.data.forEach(s => {
          settingsMap[s.settingKey] = s.settingValue;
        });
        setSettings(settingsMap);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      const res = await fetchApi<{ message: string }>('/api/admin/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsArray })
      });

      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Settings</h1>
        <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Configure platform settings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Sidebar */}
          <div className="p-4">
            <nav className="space-y-1">
              <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-purple-50 text-purple-700" style={{ ...poppins, fontWeight: 500 }}>
                <Settings className="w-5 h-5" />
                General
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50" style={{ ...poppins, fontWeight: 500 }}>
                <DollarSign className="w-5 h-5" />
                Payments
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50" style={{ ...poppins, fontWeight: 500 }}>
                <Bell className="w-5 h-5" />
                Notifications
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50" style={{ ...poppins, fontWeight: 500 }}>
                <Shield className="w-5 h-5" />
                Security
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-3 p-6">
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Site Name</label>
                    <input
                      type="text"
                      value={(settings.site_name as string) || 'Sprintern'}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                      style={poppins}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Support Email</label>
                    <input
                      type="email"
                      value={(settings.support_email as string) || 'support@sprintern.in'}
                      onChange={(e) => updateSetting('support_email', e.target.value)}
                      className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                      style={poppins}
                    />
                  </div>
                </div>
              </div>

              {/* Referral Settings */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>Referral Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="font-medium text-gray-900" style={poppins}>Enable Referrals</p>
                      <p className="text-sm text-gray-500" style={poppins}>Allow users to refer friends</p>
                    </div>
                    <button
                      onClick={() => updateSetting('referrals_enabled', !settings.referrals_enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.referrals_enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings.referrals_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Referral Bonus (₹)</label>
                    <input
                      type="number"
                      value={(settings.referral_bonus as number) || 50}
                      onChange={(e) => updateSetting('referral_bonus', parseInt(e.target.value))}
                      className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                      style={poppins}
                    />
                  </div>
                </div>
              </div>

              {/* Withdrawal Settings */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>Withdrawal Settings</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Minimum Withdrawal (₹)</label>
                  <input
                    type="number"
                    value={(settings.min_withdrawal as number) || 100}
                    onChange={(e) => updateSetting('min_withdrawal', parseInt(e.target.value))}
                    className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                    style={poppins}
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="font-medium text-gray-900" style={poppins}>Email Notifications</p>
                      <p className="text-sm text-gray-500" style={poppins}>Send email notifications to users</p>
                    </div>
                    <button
                      onClick={() => updateSetting('email_notifications', !settings.email_notifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.email_notifications ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings.email_notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                {saved && (
                  <span className="text-green-600 font-medium" style={poppins}>
                    Settings saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
