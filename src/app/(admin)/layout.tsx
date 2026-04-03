'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck,
  Award,
  Gift,
  Wallet,
  Tag,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  DollarSign,
  UserPlus,
  BarChart3,
  Shield,
  FileClock
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/submissions', icon: FileCheck, label: 'Submissions', badge: true },
  { href: '/admin/certificates', icon: Award, label: 'Certificates' },
  { href: '/admin/referrals', icon: Gift, label: 'Referrals' },
  { href: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals', badge: true },
  { href: '/admin/promocodes', icon: Tag, label: 'Promocodes' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/accounts', icon: Shield, label: 'Accounts', superAdminOnly: true },
  { href: '/admin/logs', icon: FileClock, label: 'Audit Logs', superAdminOnly: true },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [actionItems, setActionItems] = useState({ pendingSubmissions: 0, pendingWithdrawals: 0 });

  // Login page should render without the admin shell (sidebar/header)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    fetch('/api/admin/auth/session', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success && data?.data?.admin) {
          setAdminUser(data.data.admin);
        }
      })
      .catch(() => { });

    fetch('/api/admin/dashboard/action-items', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success) {
          setActionItems(data.data.actionItems);
        }
      })
      .catch(() => { });
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => { });
    window.location.href = '/admin/login';
  };

  const totalBadges = actionItems.pendingSubmissions + actionItems.pendingWithdrawals;

  return (
    <div
      className="min-h-screen bg-gray-50 flex"
      style={{ colorScheme: 'light', ['--foreground' as any]: '#111827', ['--background' as any]: '#ffffff' }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-linear-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold" style={{ ...outfit, fontWeight: 800 }}>Sprintern</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            // Show superAdminOnly items only to super_admin role
            if ((item as any).superAdminOnly && adminUser?.role !== 'super_admin') return null;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const showBadge = item.badge && totalBadges > 0;
            // Divider before first superAdminOnly item
            const prevItem = navItems[idx - 1];
            const showDivider = (item as any).superAdminOnly && !(prevItem as any)?.superAdminOnly;
            return (
              <div key={item.href}>
                {showDivider && adminUser?.role === 'super_admin' && (
                  <div className="border-t border-gray-700 my-2" />
                )}
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  style={{ ...poppins, fontWeight: 500, fontSize: '14px' }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {showBadge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {totalBadges}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-all"
            style={{ ...poppins, fontWeight: 500, fontSize: '14px' }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  style={poppins}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {totalBadges > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
                  <Bell className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-600" style={poppins}>
                    {totalBadges} pending
                  </span>
                </div>
              )}

              {adminUser && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {adminUser.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm text-gray-700" style={{ ...poppins, fontWeight: 500 }}>
                      {adminUser.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900" style={poppins}>{adminUser.email}</p>
                        <p className="text-xs text-gray-500" style={poppins}>{adminUser.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        style={poppins}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
