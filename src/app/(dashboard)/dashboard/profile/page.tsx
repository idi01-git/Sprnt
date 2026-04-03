'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Shield, CreditCard, Camera, Loader2, Link as LinkIcon,
  CheckCircle2, XCircle, AlertCircle, Save, LogOut, Mail, Phone, Calendar, Upload
} from 'lucide-react';
import {
  getUserProfile, updateUserProfile,
  updateUpi, getUserSessions, revokeSession,
  UserProfile, UserSession
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const STUDY_LEVEL_OPTIONS = [
  { value: 'NINTH', label: '9th Grade' },
  { value: 'TENTH', label: '10th Grade' },
  { value: 'ELEVENTH', label: '11th Grade' },
  { value: 'TWELFTH', label: '12th Grade' },
  { value: 'COLLEGE_1', label: 'College 1st Year' },
  { value: 'COLLEGE_2', label: 'College 2nd Year' },
  { value: 'COLLEGE_3', label: 'College 3rd Year' },
  { value: 'COLLEGE_4', label: 'College 4th Year' },
  { value: 'GRADUATED', label: 'Graduated' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payment'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', dob: '', studyLevel: '' });
  const [upiForm, setUpiForm] = useState({ upiId: '' });
  
  // States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  
  // Feedback
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [upiMsg, setUpiMsg] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, sessionRes] = await Promise.all([
        getUserProfile(),
        getUserSessions()
      ]);
      
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data.profile;
        setProfile(p);
        setProfileForm({
          name: p.name || '',
          phone: p.phone || '',
          dob: p.dob || '',
          studyLevel: p.studyLevel || ''
        });
        setUpiForm({ upiId: p.upiId || '' });
      }
      
      if (sessionRes.success && sessionRes.data) {
        setSessions(sessionRes.data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    
    try {
      const res = await updateUserProfile(profileForm);
      if (res.success && res.data) {
        setProfile(res.data.profile);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: res.error?.message || 'Failed to update profile' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleUpiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpi(true);
    setUpiMsg({ type: '', text: '' });
    
    try {
      const res = await updateUpi(upiForm.upiId);
      if (res.success) {
        setProfile(prev => prev ? { ...prev, upiId: upiForm.upiId } : null);
        setUpiMsg({ type: 'success', text: 'UPI Settings updated successfully!' });
      } else {
        setUpiMsg({ type: 'error', text: res.error?.message || 'Failed to update UPI' });
      }
    } catch (err: any) {
      setUpiMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSavingUpi(false);
      setTimeout(() => setUpiMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    alert('Avatar upload not available in MVP');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    alert('Avatar removal not available in MVP');
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out from this device?')) return;
    setRevokingSession(sessionId);
    try {
      const res = await revokeSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-12 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          {/* Page title */}
          <div className="h-9 w-56 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab bar skeleton */}
            <div className="flex border-b border-gray-100 px-2 pt-2 gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-32 bg-gray-100 rounded-t-lg" />)}
            </div>
            {/* Profile content skeleton */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-52 bg-gray-100 rounded" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 w-24 bg-gray-100 rounded-lg" />
                    <div className="h-8 w-20 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100" />
              {/* Fields */}
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3.5 w-24 bg-gray-200 rounded" />
                    <div className="h-11 bg-gray-100 rounded-xl" />
                  </div>
                ))}
                <div className="sm:col-span-2 space-y-2">
                  <div className="h-3.5 w-32 bg-gray-200 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="h-11 w-36 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-sm mb-1.5 font-semibold text-gray-700";

  return (
    <div className="min-h-screen pt-12 md:pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>
          Profile & Settings
        </h1>
        <p className="text-gray-500 mb-8 text-sm" style={poppins}>
          Manage your personal information, security preferences, and payment details.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto scroolbar-hide">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'profile' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={poppins}
            >
              <User className="w-4 h-4" /> Personal Info
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'security' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={poppins}
            >
              <Shield className="w-4 h-4" /> Security
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'payment' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={poppins}
            >
              <CreditCard className="w-4 h-4" /> Payment Details
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === 'profile' && profile && (
              <div className="animate-fade-in">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-100 border-4 border-purple-50 flex flex-col items-center justify-center relative">
                      {uploadingAvatar ? (
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      ) : profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-purple-700" style={outfit}>
                          {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                           onClick={() => fileInputRef.current?.click()}>
                        <Camera className="w-6 h-6" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900" style={outfit}>Profile Picture</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1" style={poppins}>
                      Upload a square image, max 5MB in size. We recommend 512x512px.
                    </p>
                    <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
                        style={{ ...poppins, fontWeight: 500 }}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload new
                      </button>
                      {profile.avatarUrl && (
                        <button 
                          onClick={handleRemoveAvatar}
                          disabled={removingAvatar}
                          className="px-4 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
                          style={{ ...poppins, fontWeight: 500 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 mb-8" />

                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5 mb-2">
                    {/* Name */}
                    <div>
                      <label className={labelClass} style={poppins}>Full Name</label>
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        className={inputClass} style={poppins} 
                        required 
                      />
                    </div>
                    
                    {/* Email (Readonly + Status) */}
                    <div>
                      <label className={labelClass} style={poppins}>Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          value={profile.email} 
                          readOnly 
                          className="w-full pl-9 pr-24 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 outline-none text-sm cursor-not-allowed" style={poppins} 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {profile.emailVerified ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-md">
                              <AlertCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={labelClass} style={poppins}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Your contact number"
                          value={profileForm.phone} 
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className={`pl-9 ${inputClass}`} style={poppins} 
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className={labelClass} style={poppins}>Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="date" 
                          value={profileForm.dob ? profileForm.dob.split('T')[0] : ''} 
                          onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                          className={`pl-9 ${inputClass}`} style={poppins} 
                        />
                      </div>
                    </div>

                    {/* Study Level */}
                     <div className="sm:col-span-2">
                       <label className={labelClass} style={poppins}>Current Study Level</label>
                       <select 
                         value={profileForm.studyLevel}
                         onChange={e => setProfileForm(p => ({ ...p, studyLevel: e.target.value }))}
                         className={inputClass} style={poppins}
                       >
                         <option value="">Select your education level...</option>
                         {STUDY_LEVEL_OPTIONS.map(opt => (
                           <option key={opt.value} value={opt.value}>{opt.label}</option>
                         ))}
                       </select>
                     </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`} style={poppins}>
                      {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={savingProfile}
                      className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                      style={poppins}
                    >
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1" style={outfit}>Active Sessions</h3>
                  <p className="text-sm text-gray-500 mb-5" style={poppins}>
                    These are the devices that have logged into your account. Revoke any sessions that you do not recognize.
                  </p>

                  {sessions.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-gray-500 text-sm" style={poppins}>No active sessions found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors bg-white">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Shield className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900" style={poppins}>{s.device || 'Unknown Device'}</p>
                                {s.isCurrent && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase" style={outfit}>This Device</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500" style={poppins}>
                                IP: {s.ip} • Last active: {new Date(s.lastActive).toLocaleDateString()} {new Date(s.lastActive).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              disabled={revokingSession === s.id}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              style={{ ...poppins, fontWeight: 500 }}
                            >
                              {revokingSession === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="animate-fade-in">
                <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl mb-8 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-purple-900 mb-1" style={outfit}>Why do we need this?</h4>
                    <p className="text-xs text-purple-700 leading-relaxed" style={poppins}>
                      Your UPI ID is required so we can transfer your wallet balance (earned via referrals) directly to your bank account when you request a withdrawal. Make sure it is accurate.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpiSave} className="space-y-5 max-w-xl">
                  <div>
                    <label className={labelClass} style={poppins}>UPI Virtual Payment Address (VPA)</label>
                    <div className="relative mb-2">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. yourname@okicici, mobile@paytm"
                        value={upiForm.upiId} 
                        onChange={e => setUpiForm({ upiId: e.target.value })}
                        className={`pl-9 ${inputClass}`} style={poppins} 
                        required 
                      />
                    </div>
                  </div>

                  {upiMsg.text && (
                    <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${upiMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`} style={poppins}>
                      {upiMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {upiMsg.text}
                    </div>
                  )}

                  <div className="flex">
                    <button 
                      type="submit" 
                      disabled={savingUpi}
                      className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 hover:shadow-lg disabled:opacity-60 flex items-center gap-2 transition-all"
                      style={poppins}
                    >
                      {savingUpi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save UPI Details
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
