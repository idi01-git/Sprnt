'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
}

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  user: AuthedUser | null;
  status: SessionStatus;
  unreadCount: number;
  /** Force a re-fetch (e.g. after profile update, login, logout) */
  refresh: () => Promise<void>;
  setUnreadCount: (n: number) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────
const SessionContext = createContext<SessionContextValue>({
  user: null,
  status: 'loading',
  unreadCount: 0,
  refresh: async () => {},
  setUnreadCount: () => {},
});

// ─── Provider ───────────────────────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json().catch(() => null);

      if (sessionData?.success && sessionData?.data?.user) {
        setUser(sessionData.data.user);
        setStatus('authenticated');

        // Fetch unread notification count alongside session
        const notifRes = await fetch('/api/notifications/unread-count', { credentials: 'include' });
        const notifData = await notifRes.json().catch(() => null);
        if (notifData?.success) {
          setUnreadCount(notifData.data.unreadCount ?? 0);
        }
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  // Only fetch once on mount — not on every route change
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, status, unreadCount, refresh, setUnreadCount }}>
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useSession() {
  return useContext(SessionContext);
}
