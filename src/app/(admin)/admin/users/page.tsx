'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Loader2,
  UserPlus,
  Shield,
  ShieldOff,
  Eye,
  MoreVertical
} from 'lucide-react';
import { getAdminUsers, suspendAdminUser, activateAdminUser, AdminUser } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'all'>('all');

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAdminUsers({ search, status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 });
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await suspendAdminUser(userId);
      } else {
        await activateAdminUser(userId);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Users</h1>
          <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Manage registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={poppins}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400" style={poppins}>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Study Level</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Verified</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900" style={poppins}>{user.name}</p>
                          <p className="text-xs text-gray-500" style={poppins}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>
                      {user.studyLevel?.replace(/_/g, ' ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={poppins}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.emailVerified ? (
                        <span className="text-green-600"><Shield className="w-4 h-4" /></span>
                      ) : (
                        <span className="text-gray-400"><ShieldOff className="w-4 h-4" /></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500" style={poppins}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${user.id}`} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`p-2 rounded-lg ${user.status === 'active' ? 'hover:bg-red-50' : 'hover:bg-green-50'}`}
                        >
                          {user.status === 'active' ? (
                            <ShieldOff className="w-4 h-4 text-red-600" />
                          ) : (
                            <Shield className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
