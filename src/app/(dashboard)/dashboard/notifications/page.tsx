'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Loader2,
  Info,
  AlertTriangle,
  Gift,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  CheckCheck
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const typeIcons: Record<string, React.ElementType> = {
  system: Info,
  enrollment: CreditCard,
  referral_bonus: Gift,
  certificate_issued: CheckCircle2,
  quiz_passed: CheckCircle2,
  withdrawal: CreditCard,
  warning: AlertTriangle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(1, 50);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6" style={{ ...poppins, fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> My Learning
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3" style={{ ...outfit, fontWeight: 800 }}>
              <Bell className="w-7 h-7 text-purple-600" /> Notifications
              {unreadCount > 0 && (
                <span className="text-sm px-2.5 py-1 rounded-full bg-purple-100 text-purple-700" style={poppins}>
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-purple-600 hover:bg-purple-50 transition-colors"
              style={{ ...poppins, fontWeight: 600 }}
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400" style={poppins}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${n.read
                      ? 'bg-white border-gray-100'
                      : 'bg-purple-50/50 border-purple-100 shadow-sm'
                    }`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-purple-100'
                    }`}>
                    <Icon className={`w-5 h-5 ${n.read ? 'text-gray-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`} style={poppins}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2" style={poppins}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5" style={poppins}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
