'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, ToggleLeft, ToggleRight, X, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getAdminPromocodes, createAdminPromocode, updateAdminPromocode,
  togglePromocodeStatus, deleteAdminPromocode, AdminPromocode,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const EMPTY_FORM = {
  code: '', description: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10, maxDiscount: 100,
  usageLimit: 100, perUserLimit: 1,
  validFrom: '', validUntil: '',
};

export default function AdminPromocodesPage() {
  const [promocodes, setPromocodes] = useState<AdminPromocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<AdminPromocode | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminPromocode | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, [search]);

  async function fetchData() {
    setLoading(true);
    const res = await getAdminPromocodes({ search: search || undefined, limit: 50 });
    if (res.success && res.data) setPromocodes(res.data.promocodes);
    setLoading(false);
  }

  function openCreate() {
    setFormData(EMPTY_FORM);
    setEditTarget(null);
    setMode('create');
  }

  function openEdit(p: AdminPromocode) {
    setFormData({
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      maxDiscount: p.maxDiscount,
      usageLimit: p.usageLimit,
      perUserLimit: p.perUserLimit,
      validFrom: p.validFrom?.split('T')[0] || '',
      validUntil: p.validUntil?.split('T')[0] || '',
    });
    setEditTarget(p);
    setMode('edit');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let res;
    if (mode === 'edit' && editTarget) res = await updateAdminPromocode(editTarget.id, formData);
    else res = await createAdminPromocode(formData);

    if (res.success) {
      showToast(mode === 'edit' ? 'Promocode updated' : 'Promocode created');
      setMode(null);
      fetchData();
    } else {
      showToast('Save failed', false);
    }
    setSaving(false);
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    try {
      const res = await togglePromocodeStatus(id);
      if (res.success) {
        showToast(currentStatus ? 'Promocode deactivated' : 'Promocode activated');
        fetchData();
      } else {
        showToast('Failed to toggle status', false);
      }
    } catch (err) {
      showToast('Error toggling status', false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteAdminPromocode(deleteTarget.id);
    if (res.success) { showToast('Promocode deleted'); setDeleteTarget(null); fetchData(); }
    else showToast('Delete failed', false);
    setDeleting(false);
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const ModalForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            {mode === 'edit' ? 'Edit Promocode' : 'Create Promocode'}
          </h2>
          <button onClick={() => setMode(null)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Code *</label>
              <input type="text" value={formData.code} required
                onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none font-mono uppercase" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Type</label>
              <select value={formData.discountType} onChange={e => setFormData(f => ({ ...f, discountType: e.target.value as any }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Discount Value</label>
              <input type="number" value={formData.discountValue} min={0} required
                onChange={e => setFormData(f => ({ ...f, discountValue: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Max Discount (₹)</label>
              <input type="number" value={formData.maxDiscount} min={0}
                onChange={e => setFormData(f => ({ ...f, maxDiscount: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Usage Limit</label>
              <input type="number" value={formData.usageLimit} min={1}
                onChange={e => setFormData(f => ({ ...f, usageLimit: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Per User Limit</label>
              <input type="number" value={formData.perUserLimit} min={1}
                onChange={e => setFormData(f => ({ ...f, perUserLimit: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Valid From *</label>
              <input type="date" value={formData.validFrom} required
                onChange={e => setFormData(f => ({ ...f, validFrom: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Valid Until *</label>
              <input type="date" value={formData.validUntil} required
                onChange={e => setFormData(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" style={poppins} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" style={poppins}>Description</label>
            <textarea rows={2} value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Short note about this promo…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none" style={poppins} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setMode(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={poppins}>Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ ...poppins, fontWeight: 600 }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'edit' ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ ...outfit, fontWeight: 800 }}>Delete Promocode?</h2>
            <p className="text-sm text-gray-500 mb-6" style={poppins}>
              This will permanently delete <strong className="font-mono">{deleteTarget.code}</strong>. All associated usage records will remain.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50" style={poppins}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-red-700"
                style={{ ...poppins, fontWeight: 600 }}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {mode && <ModalForm />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Promocodes</h1>
          <p className="text-gray-500 mt-1 text-sm" style={poppins}>Create discount codes students can apply during course checkout to reduce the course price</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all text-sm"
          style={{ ...poppins, fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> Create Promocode
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search promocodes…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" style={poppins} />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}
          </div>
        ) : promocodes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400" style={poppins}>No promocodes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {promocodes.map(promo => (
              <div key={promo.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white group">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-lg text-gray-900 font-mono" style={{ ...outfit, fontWeight: 800 }}>{promo.code}</p>
                    <p className="text-xs text-gray-400 truncate" style={poppins}>{promo.description || 'No description'}</p>
                  </div>
                  <button onClick={() => handleToggle(promo.id, promo.isActive)} className="ml-2 shrink-0 cursor-pointer">
                    {promo.isActive ? <ToggleRight className="w-7 h-7 text-green-600" /> : <ToggleLeft className="w-7 h-7 text-gray-400" />}
                  </button>
                </div>

                {/* Discount info */}
                <div className="bg-purple-50 rounded-xl px-4 py-2.5 mb-3">
                  <p className="font-bold text-purple-700 text-lg" style={{ ...outfit, fontWeight: 800 }}>
                    {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
                    {promo.discountType === 'percentage' && promo.maxDiscount > 0 && (
                      <span className="text-sm font-normal text-purple-500 ml-1">max ₹{promo.maxDiscount}</span>
                    )}
                  </p>
                  <p className="text-xs text-purple-400" style={poppins}>{promo.usedCount} / {promo.usageLimit} uses</p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-gray-100 mb-3">
                  <div
                    className="h-1.5 rounded-full bg-linear-to-r from-purple-500 to-blue-500"
                    style={{ width: `${Math.min(100, (promo.usedCount / promo.usageLimit) * 100)}%` }}
                  />
                </div>

                {/* Validity */}
                <p className="text-xs text-gray-400 mb-3" style={poppins}>
                  {fmt(promo.validFrom)} — {fmt(promo.validUntil)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`flex-1 text-center px-2 py-1 rounded-lg text-xs font-semibold ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`} style={poppins}>
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => openEdit(promo)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><Edit2 className="w-3.5 h-3.5 text-gray-600" /></button>
                  <button onClick={() => setDeleteTarget(promo)} className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
