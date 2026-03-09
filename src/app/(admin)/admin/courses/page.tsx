'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { getAdminCourses, getBranches, toggleAdminCourseStatus, createAdminCourse, AdminCourse, Branch } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const branchColors: Record<string, string> = {
  Chemical: 'bg-pink-100 text-pink-700',
  Civil: 'bg-emerald-100 text-emerald-700',
  Mechanical: 'bg-purple-100 text-purple-700',
  Electrical: 'bg-blue-100 text-blue-700',
  ECE: 'bg-red-100 text-red-700',
  'CS/IT': 'bg-green-100 text-green-700',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCourse, setNewCourse] = useState({
    courseName: '',
    branch: '',
    price: 299,
    courseDescription: '',
    slug: ''
  });

  useEffect(() => {
    fetchData();
  }, [search, branchFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, branchesRes] = await Promise.all([
        getAdminCourses({ search, branch: branchFilter, status: statusFilter, limit: 50 }),
        getBranches()
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses);
      }
      if (branchesRes.success && branchesRes.data) {
        setBranches(branchesRes.data.branches);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (courseId: string) => {
    try {
      await toggleAdminCourseStatus(courseId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminCourse(newCourse);
      setShowModal(false);
      setNewCourse({ courseName: '', branch: '', price: 299, courseDescription: '', slug: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Courses</h1>
          <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Manage your course catalog</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all"
          style={{ ...poppins, fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={poppins}
            />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.branch} value={b.branch}>{b.branch} ({b.courseCount})</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={poppins}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400" style={poppins}>No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Course</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Branch</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Enrollments</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={poppins}>{course.courseName}</p>
                      <p className="text-xs text-gray-400" style={poppins}>{course.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${branchColors[course.branch] || 'bg-gray-100 text-gray-700'}`} style={poppins}>
                        {course.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900" style={poppins}>₹{course.price}</td>
                    <td className="px-6 py-4 text-gray-600" style={poppins}>{course.enrollmentsCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(course.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        style={poppins}
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/courses/${course.id}`} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold" style={{ ...outfit, fontWeight: 800 }}>Create Course</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Course Name</label>
                <input
                  type="text"
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Branch</label>
                <select
                  value={newCourse.branch}
                  onChange={(e) => setNewCourse({ ...newCourse, branch: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.branch} value={b.branch}>{b.branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Price (₹)</label>
                <input
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: parseInt(e.target.value) })}
                  required
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Slug</label>
                <input
                  type="text"
                  value={newCourse.slug}
                  onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  style={poppins}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
