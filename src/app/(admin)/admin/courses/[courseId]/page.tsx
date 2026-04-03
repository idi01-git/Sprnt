'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, BookOpen,
  Users, ToggleLeft, ToggleRight, Copy, Plus, Trash2,
  Edit2, X, Check,
} from 'lucide-react';
import {
  getAdminCourseDetail, updateAdminCourse, toggleAdminCourseStatus,
  duplicateAdminCourse, getAdminCourseStats, getAdminCourseEnrollments,
  getAdminCourseModules, createAdminModule, updateAdminModule, deleteAdminModule,
  getAdminBranches, AdminCourseDetail, AdminModule, Branch,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const TABS = ['Details', 'Modules', 'Enrollments', 'Stats'] as const;
type Tab = typeof TABS[number];

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AdminCourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams?.courseId;
  
  // Add a loading state for when params are being resolved
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tab, setTab] = useState<Tab>('Details');
  const [loading, setLoading] = useState(true);
  
  // Set paramsLoaded when resolvedParams changes
  useEffect(() => {
    if (resolvedParams) {
      setParamsLoaded(true);
    }
  }, [resolvedParams]);
  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const [form, setForm] = useState({ courseName: '', slug: '', branch: '', price: 0, courseDescription: '', problemStatementText: '', isActive: false });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [modules, setModules] = useState<AdminModule[]>([]);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', contentText: '', dayNumber: 1, isFreePreview: false });
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleForm, setNewModuleForm] = useState({ title: '', contentText: '', dayNumber: 1, isFreePreview: false });
  const [moduleLoading, setModuleLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setError(null);
    Promise.all([
      getAdminCourseDetail(courseId),
      getAdminBranches(),
    ]).then(([courseRes, branchRes]) => {
      if (courseRes.success && courseRes.data) {
        const c = courseRes.data.course;
        setCourse(c);
        setForm({
          courseName: c.courseName,
          slug: c.slug,
          branch: c.branch,
          price: c.price,
          courseDescription: c.courseDescription || '',
          problemStatementText: c.problemStatementText || '',
          isActive: c.isActive,
        });
        setModules(c.modules || []);
      } else {
        const errorMsg = courseRes.error?.message || 'Failed to load course';
        console.error('[Course Detail] API error:', courseRes.error);
        setError(errorMsg);
      }
      if (branchRes.success && branchRes.data && Array.isArray(branchRes.data.branches)) setBranches(branchRes.data.branches);
      setLoading(false);
    }).catch((err) => {
      console.error('[Course Detail] Promise error:', err);
      setError('Network error - please try again');
      setLoading(false);
    });
  }, [courseId]);

  useEffect(() => {
    if (tab === 'Enrollments') fetchEnrollments();
    if (tab === 'Stats') fetchStats();
    if (tab === 'Modules') fetchModules();
  }, [tab]);

  async function fetchEnrollments() {
    setTabLoading(true);
    const res = await getAdminCourseEnrollments(courseId, { limit: 50 });
    setTabData(res.success ? res.data?.enrollments : []);
    setTabLoading(false);
  }

  async function fetchStats() {
    setTabLoading(true);
    const res = await getAdminCourseStats(courseId);
    setTabData(res.success ? res.data?.stats : null);
    setTabLoading(false);
  }

  async function fetchModules() {
    setTabLoading(true);
    const res = await getAdminCourseModules(courseId);
    if (res.success && res.data) setModules(res.data.modules);
    setTabLoading(false);
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateAdminCourse(courseId, form);
    if (res.success) { showToast('Course updated successfully'); setDirty(false); }
    else showToast('Update failed', false);
    setSaving(false);
  }

  async function handleToggleStatus() {
    await toggleAdminCourseStatus(courseId);
    const res = await getAdminCourseDetail(courseId);
    if (res.success && res.data) { setCourse(res.data.course); setForm(f => ({ ...f, isActive: res.data!.course.isActive })); }
    showToast(`Course ${!form.isActive ? 'deactivated' : 'activated'}`);
  }

  async function handleDuplicate() {
    const res = await duplicateAdminCourse(courseId);
    if (res.success) {
      showToast('Course duplicated — check courses list');
    } else {
      const msg = res.error && typeof res.error === 'object' 
        ? (res.error as {message?: string}).message || 'Duplicate failed'
        : 'Duplicate failed';
      showToast(msg, false);
    }
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    setModuleLoading('new');
    const res = await createAdminModule(courseId, {
      dayNumber: newModuleForm.dayNumber,
      title: newModuleForm.title,
      contentText: newModuleForm.contentText,
      isFreePreview: newModuleForm.isFreePreview,
    });
    if (res.success) {
      showToast('Module added');
      setAddingModule(false);
      setNewModuleForm({ title: '', contentText: '', dayNumber: (modules?.length ?? 0) + 1, isFreePreview: false });
      fetchModules();
    } else showToast('Failed to add module', false);
    setModuleLoading(null);
  }

  async function handleUpdateModule(moduleId: string) {
    setModuleLoading(moduleId);
    const res = await updateAdminModule(courseId, moduleId, {
      title: moduleForm.title,
      contentText: moduleForm.contentText,
      dayNumber: moduleForm.dayNumber,
      isFreePreview: moduleForm.isFreePreview,
    });
    if (res.success) { showToast('Module updated'); setEditingModule(null); fetchModules(); }
    else showToast('Update failed', false);
    setModuleLoading(null);
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Delete this module? This cannot be undone.')) return;
    setModuleLoading(moduleId + '_del');
    const res = await deleteAdminModule(courseId, moduleId);
    if (res.success) { showToast('Module deleted'); fetchModules(); }
    else showToast('Delete failed', false);
    setModuleLoading(null);
  }

  function startEdit(m: AdminModule) {
    setEditingModule(m.id);
    setModuleForm({
      title: m.title,
      contentText: m.contentText || '',
      dayNumber: m.dayNumber,
      isFreePreview: m.isFreePreview,
    });
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-8" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-6" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500" style={poppins}>{error || 'Course not found'}</p>
        <Link href="/admin/courses" className="text-purple-600 hover:underline text-sm" style={poppins}>Back to Courses</Link>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6 transition-colors" style={poppins}>
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{course.courseName}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`} style={poppins}>
              {course.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-500 text-sm" style={poppins}>
            <span className="font-mono text-xs">{course.courseId}</span> · /{course.slug} · {course.branch} · ₹{Number(course.price || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleToggleStatus} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${form.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`} style={{ ...poppins, fontWeight: 600 }}>
            {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {form.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm transition-all" style={{ ...poppins, fontWeight: 600 }}>
            <Copy className="w-4 h-4" /> Duplicate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-4 text-sm whitespace-nowrap border-b-2 transition-all ${tab === t ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              style={{ ...poppins, fontWeight: tab === t ? 600 : 400 }}
            >{t}</button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {tab === 'Details' && (
            <form onSubmit={handleSaveDetails} className="space-y-5 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Course Name</label>
                  <input type="text" value={form.courseName}
                    onChange={e => { setForm(f => ({ ...f, courseName: e.target.value })); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Slug</label>
                  <input type="text" value={form.slug} disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-mono text-gray-500" style={poppins} />
                  <p className="text-xs text-gray-400 mt-1" style={poppins}>Auto-generated from name</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Branch</label>
                  <select value={form.branch} onChange={e => { setForm(f => ({ ...f, branch: e.target.value })); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins}>
                    <option value="">Select branch…</option>
                    {branches.map(b => <option key={b.branch} value={b.branch}>{b.branch}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Price (₹)</label>
                  <input type="number" value={form.price} min={0}
                    onChange={e => { setForm(f => ({ ...f, price: parseInt(e.target.value) || 0 })); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Course Description</label>
                <textarea rows={4} value={form.courseDescription}
                  onChange={e => { setForm(f => ({ ...f, courseDescription: e.target.value })); setDirty(true); }}
                  placeholder="Brief overview of what students will learn…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900 resize-none" style={poppins} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Problem Statement</label>
                <textarea rows={5} value={form.problemStatementText}
                  onChange={e => { setForm(f => ({ ...f, problemStatementText: e.target.value })); setDirty(true); }}
                  placeholder="The engineering problem students will solve. This appears in their submission prompt…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900 resize-none" style={poppins} />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving || !dirty}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ ...poppins, fontWeight: 600 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {tab === 'Modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500" style={poppins}>{(modules?.length ?? 0)} modules (days)</p>
                <button onClick={() => setAddingModule(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-md transition-all"
                  style={{ ...poppins, fontWeight: 600 }}>
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>

              {addingModule && (
                <form onSubmit={handleAddModule} className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-purple-900" style={{ ...outfit, fontWeight: 700 }}>New Module (Day {newModuleForm.dayNumber})</h3>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newModuleForm.isFreePreview}
                        onChange={e => setNewModuleForm(f => ({ ...f, isFreePreview: e.target.checked }))}
                        className="w-4 h-4 rounded accent-purple-600"
                      />
                      <span className="text-purple-700 font-medium" style={poppins}>Free Preview</span>
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Day #</label>
                      <input type="number" value={newModuleForm.dayNumber} min={1} max={7}
                        onChange={e => setNewModuleForm(f => ({ ...f, dayNumber: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Title *</label>
                      <input type="text" value={newModuleForm.title}
                        onChange={e => setNewModuleForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Problem Understanding & Brainstorming"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Content (shown to students)</label>
                    <textarea rows={3} value={newModuleForm.contentText}
                      onChange={e => setNewModuleForm(f => ({ ...f, contentText: e.target.value }))}
                      placeholder="Instructions, reference material, or brief for this day…"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900 resize-none" style={poppins} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setAddingModule(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={poppins}>Cancel</button>
                    <button type="submit" disabled={moduleLoading === 'new' || !newModuleForm.title.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm disabled:opacity-50" style={{ ...poppins, fontWeight: 600 }}>
                      {moduleLoading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Add Module
                    </button>
                  </div>
                </form>
              )}

              {tabLoading ? (
                <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
              ) : (modules?.length ?? 0) === 0 ? (
                <div className="text-center py-12"><p className="text-gray-400" style={poppins}>No modules yet — add your first day</p></div>
              ) : (
                <div className="space-y-3">
                  {(modules ?? []).sort((a, b) => a.dayNumber - b.dayNumber).map(m => {
                    const mod = m as AdminModule;
                    return (
                    <div key={m.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                      {editingModule === m.id ? (
                        <div className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-purple-900 text-sm" style={{ ...outfit, fontWeight: 700 }}>Edit — Day {moduleForm.dayNumber}</h3>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={moduleForm.isFreePreview}
                                onChange={e => setModuleForm(f => ({ ...f, isFreePreview: e.target.checked }))}
                                className="w-4 h-4 rounded accent-purple-600" />
                              <span className="text-purple-700 font-medium" style={poppins}>Free Preview</span>
                            </label>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Day #</label>
                              <input type="number" value={moduleForm.dayNumber} min={1} max={7}
                                onChange={e => setModuleForm(f => ({ ...f, dayNumber: parseInt(e.target.value) || 1 }))}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Title</label>
                              <input type="text" value={moduleForm.title}
                                onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1" style={poppins}>Content</label>
                            <textarea rows={3} value={moduleForm.contentText}
                              onChange={e => setModuleForm(f => ({ ...f, contentText: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900 resize-none" style={poppins} />
                          </div>
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => setEditingModule(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={poppins}>Cancel</button>
                            <button onClick={() => handleUpdateModule(m.id)} disabled={moduleLoading === m.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm disabled:opacity-50" style={{ ...poppins, fontWeight: 600 }}>
                              {moduleLoading === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/admin/courses/${courseId}/modules/${m.id}`}
                              className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 hover:opacity-90 transition-opacity" style={outfit}>
                              {m.dayNumber}
                            </Link>
                            <div>
                              <Link href={`/admin/courses/${courseId}/modules/${m.id}`} className="font-semibold text-gray-900 text-sm hover:text-purple-600 transition-colors" style={poppins}>{m.title || `Day ${m.dayNumber}`}</Link>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1" style={poppins}>
                                {(mod.contentText || 'No content').substring(0, 80)}
                                {(mod.contentText || '').length > 80 ? '…' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5 mr-2">
                              {mod.isFreePreview && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full" style={poppins}>Free</span>}
                            </div>
                            <Link href={`/admin/courses/${courseId}/modules/${m.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors" style={poppins}>
                              Edit Content →
                            </Link>
                            <button onClick={() => handleDeleteModule(m.id)} disabled={moduleLoading === m.id + '_del'}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                              {moduleLoading === m.id + '_del' ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'Enrollments' && (
            tabLoading ? (
              <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
            ) : !tabData || tabData.length === 0 ? (
              <div className="text-center py-12"><p className="text-gray-400" style={poppins}>No enrollments yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    {['Student', 'Email', 'Progress', 'Enrolled'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-500 font-semibold" style={poppins}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {tabData.map((e: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900" style={poppins}>{e.userName}</td>
                        <td className="py-3 px-4 text-gray-500" style={poppins}>{e.userEmail}</td>
                        <td className="py-3 px-4 text-gray-600" style={poppins}>Day {e.currentDay} / {e.totalDays || 7}</td>
                        <td className="py-3 px-4 text-gray-500" style={poppins}>{fmt(e.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'Stats' && (
            tabLoading ? (
              <div className="animate-pulse grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
            ) : !tabData ? (
              <div className="text-center py-12"><p className="text-gray-400" style={poppins}>No stats available</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(tabData).map(([key, val], i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 capitalize" style={poppins}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>{String(val)}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}