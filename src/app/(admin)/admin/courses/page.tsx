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
  Check,
  Archive,
  ArchiveRestore,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { getAdminCourses, getAdminBranches, toggleAdminCourseStatus, deleteAdminCourse, restoreAdminCourse, createAdminCourse, AdminCourse, Branch } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const BRANCHES = ['Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS_IT'] as const;

const branchColors: Record<string, string> = {
  Chemical: 'bg-pink-100 text-pink-700',
  Civil: 'bg-emerald-100 text-emerald-700',
  Mechanical: 'bg-purple-100 text-purple-700',
  Electrical: 'bg-blue-100 text-blue-700',
  ECE: 'bg-red-100 text-red-700',
  'CS/IT': 'bg-green-100 text-green-700',
  'CS_IT': 'bg-green-100 text-green-700',
};

function getBranchColor(branch: string | undefined): string {
  if (!branch) return 'bg-gray-100 text-gray-700';
  const normalized = branch.replace('_', '/');
  return branchColors[normalized] || branchColors[branch] || 'bg-gray-100 text-gray-700';
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const [newCourse, setNewCourse] = useState({
    courseName: '',
    affiliatedBranch: '',
    price: 299,
    courseDescription: '',
    courseThumbnail: '',
    problemStatementText: '',
    tags: [] as string[],
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
        getAdminBranches()
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(Array.isArray(coursesRes.data.courses) ? coursesRes.data.courses : []);
      }
      if (branchesRes.success && branchesRes.data && Array.isArray(branchesRes.data.branches)) {
        setBranches(branchesRes.data.branches);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (courseId: string, currentIsActive: boolean) => {
    try {
      const res = await toggleAdminCourseStatus(courseId, !currentIsActive);
      if (res.success) {
        showToast(`Course ${currentIsActive ? 'deactivated' : 'activated'}`);
        fetchData();
      } else {
        showToast(res.error?.message || 'Failed to update status', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', false);
    }
  };

  const handleArchive = async (course: AdminCourse) => {
    setArchiving(course.id);
    try {
      // Archive means setting isActive to false, unarchive means setting to true
      const newStatus = !course.isActive;
      const res = await toggleAdminCourseStatus(course.courseId, newStatus);
      if (res.success) {
        showToast(newStatus ? 'Course archived' : 'Course unarchived');
        fetchData();
      } else {
        showToast(res.error?.message || 'Failed to archive course', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to archive course', false);
    } finally {
      setArchiving(null);
    }
  };

  const handleDeleteClick = (course: AdminCourse) => {
    setDeleteCourse(course);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCourse) return;
    setDeleting(true);
    try {
      const res = await deleteAdminCourse(deleteCourse.courseId);
      if (res.success) {
        showToast('Course deleted successfully');
        setDeleteCourse(null);
        fetchData();
      } else {
        showToast(res.error?.message || 'Failed to delete course', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete course', false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (courseId: string) => {
    setRestoring(courseId);
    try {
      const res = await restoreAdminCourse(courseId);
      if (res.success) {
        showToast('Course restored successfully');
        fetchData();
      } else {
        showToast(res.error?.message || 'Failed to restore course', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to restore course', false);
    } finally {
      setRestoring(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        courseName: newCourse.courseName,
        affiliatedBranch: newCourse.affiliatedBranch,
        coursePrice: newCourse.price,
        courseThumbnail: newCourse.courseThumbnail || 'https://placehold.co/600x400/png?text=Course',
        courseDescription: newCourse.courseDescription,
        problemStatementText: newCourse.problemStatementText || 'Engineering design project.',
        isActive: true,
      } as any;
      await createAdminCourse(payload);
      setShowModal(false);
      setNewCourse({ courseName: '', affiliatedBranch: '', price: 299, courseDescription: '', courseThumbnail: '', problemStatementText: '', tags: [], slug: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Courses</h1>
          <p className="text-gray-500 mt-1" style={{ ...poppins, fontSize: '14px' }}>Manage your course catalog</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder-gray-400"
              style={poppins}
            />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Course</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Branch</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Enrollments</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700" style={poppins}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={poppins}>No courses found</td>
                  </tr>
                ) : courses.map((course) => {
                  const branchKey = Object.keys(branchColors).find(k => course.branch?.toLowerCase().includes(k.toLowerCase())) || '';
                  return (
                    <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900" style={poppins}>{course.courseName || 'Unknown'}</p>
                        <p className="text-xs text-gray-400" style={poppins}>{course.slug || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getBranchColor(course.branch)}`} style={poppins}>
                          {course.branch || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900" style={poppins}>₹{Number(course.price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600" style={poppins}>{course.enrollmentsCount ?? 0}</td>
                      <td className="px-6 py-4">
                          {course.deletedAt ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600" style={poppins}>
                              Deleted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(course.courseId, course.isActive)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                              style={poppins}
                            >
                              {course.isActive ? 'Active' : 'Inactive'}
                            </button>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {course.deletedAt ? (
                            // Course is deleted - show restore button
                            <button
                              onClick={() => handleRestore(course.courseId)}
                              disabled={restoring === course.courseId}
                              title="Restore"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {restoring === course.courseId ? (
                                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                              ) : (
                                <RotateCcw className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                          ) : (
                            // Course is not deleted - show archive/unarchive and delete
                            <>
                              <Link href={`/admin/courses/${course.courseId}`} className="p-2 hover:bg-gray-100 rounded-lg" title="View / Edit">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </Link>
                              <button
                                onClick={() => handleArchive(course)}
                                disabled={archiving === course.id}
                                title={course.isActive ? 'Archive' : 'Unarchive'}
                                className="p-2 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {archiving === course.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                ) : course.isActive ? (
                                  <Archive className="w-4 h-4 text-amber-600" />
                                ) : (
                                  <ArchiveRestore className="w-4 h-4 text-green-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(course)}
                                title="Delete"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900" style={outfit}>Delete Course</h2>
                  <p className="text-sm text-gray-500" style={poppins}>This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-1" style={poppins}>
                Are you sure you want to delete <strong>"{deleteCourse.courseName}"</strong>?
              </p>
              {((deleteCourse as any).enrollmentsCount ?? 0) > 0 && (
                <p className="text-sm text-amber-600 mb-4" style={poppins}>
                  Warning: {((deleteCourse as any).enrollmentsCount)} student(s) are enrolled in this course.
                </p>
              )}
              <p className="text-sm text-gray-500 mb-6" style={poppins}>
                The course will be soft-deleted and hidden from students. You can restore it later from the admin panel.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCourse(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                  style={poppins}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium"
                  style={poppins}
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2, 7) })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Branch</label>
                <select
                  value={newCourse.affiliatedBranch}
                  onChange={(e) => setNewCourse({ ...newCourse, affiliatedBranch: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
                  style={poppins}
                >
                  <option value="">Select Branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Thumbnail URL</label>
                <input
                  type="url"
                  value={newCourse.courseThumbnail}
                  onChange={(e) => setNewCourse({ ...newCourse, courseThumbnail: e.target.value })}
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={poppins}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Description</label>
                <textarea
                  value={newCourse.courseDescription}
                  onChange={(e) => setNewCourse({ ...newCourse, courseDescription: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  style={poppins}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={poppins}>Problem Statement</label>
                <textarea
                  value={newCourse.problemStatementText}
                  onChange={(e) => setNewCourse({ ...newCourse, problemStatementText: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe the engineering problem students will solve..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50"
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
