'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2,
  Youtube, FileText, Check,
} from 'lucide-react';
import {
  getAdminModuleDetail, updateAdminModule,
  getAdminModuleQuiz, replaceAdminModuleQuiz,
  getAdminCourseDetail, AdminModule,
} from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

const TABS = ['Basic Info', 'Video & Notes', 'Quiz'] as const;
type Tab = typeof TABS[number];

interface QuizFormQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
}

export default function AdminModuleEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = use(params);

  const [module, setModule] = useState<AdminModule | null>(null);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Basic Info');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    dayNumber: 1,
    contentText: '',
    isFreePreview: false,
    youtubeUrl: '',
    notesPdfUrl: '',
  });
  const [dirty, setDirty] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizFormQuestion[]>([]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [moduleRes, quizRes, courseRes] = await Promise.all([
        getAdminModuleDetail(courseId, moduleId),
        getAdminModuleQuiz(courseId, moduleId),
        getAdminCourseDetail(courseId),
      ]);

      if (moduleRes.success && moduleRes.data) {
        const m = moduleRes.data;
        setModule(m);
        setForm({
          title: m.title,
          dayNumber: m.dayNumber,
          contentText: m.contentText || '',
          isFreePreview: m.isFreePreview || false,
          youtubeUrl: m.youtubeUrl || '',
          notesPdfUrl: m.notesPdfUrl || '',
        });
      }

      if (courseRes.success && courseRes.data) {
        setCourseName(courseRes.data.course.courseName);
      }

      if (quizRes.success && quizRes.data && Array.isArray(quizRes.data)) {
        const parsed: QuizFormQuestion[] = quizRes.data.map((q: any) => ({
          question: q.questionText || q.question || '',
          options: (q.options || []).map((o: any, i: number) => ({
            text: typeof o === 'string' ? o : o.text || '',
            isCorrect: i === q.correctOptionIndex || o.isCorrect || false,
          })),
        }));
        setQuizQuestions(parsed.length > 0 ? parsed : emptyQuiz());
      } else {
        setQuizQuestions(emptyQuiz());
      }

      setLoading(false);
    }
    load();
  }, [courseId, moduleId]);

  function emptyQuiz(): QuizFormQuestion[] {
    return Array.from({ length: 5 }, () => ({
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    }));
  }

  async function handleSaveBasic(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateAdminModule(courseId, moduleId, {
      title: form.title,
      dayNumber: form.dayNumber,
      contentText: form.contentText,
      isFreePreview: form.isFreePreview,
    });
    if (res.success) {
      showToast('Module updated');
      setDirty(false);
    } else {
      showToast('Save failed', false);
    }
    setSaving(false);
  }

  async function handleSaveMedia(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Validate YouTube URL format if provided
    if (form.youtubeUrl) {
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
      if (!urlPattern.test(form.youtubeUrl)) {
        showToast('Invalid YouTube URL format', false)
        setSaving(false)
        return
      }
    }
    const res = await updateAdminModule(courseId, moduleId, {
      youtubeUrl: form.youtubeUrl || null,
      notesPdfUrl: form.notesPdfUrl || null,
    });
    if (res.success) {
      showToast('Media links updated');
      setDirty(false);
    } else {
      const msg = res.error && typeof res.error === 'object' 
        ? (res.error as {message?: string}).message || 'Save failed'
        : 'Save failed'
      showToast(msg, false);
    }
    setSaving(false);
  }

  async function handleSaveQuiz() {
    setSaving(true);
    // Validate at least question text and one correct answer per question
    for (const q of quizQuestions) {
      if (!q.question.trim()) {
        showToast('Please fill in all question texts', false);
        setSaving(false);
        return;
      }
      if (!q.options.some(o => o.isCorrect)) {
        showToast('Each question must have a correct answer selected', false);
        setSaving(false);
        return;
      }
      if (q.options.some(o => !o.text.trim())) {
        showToast('All options must have text', false);
        setSaving(false);
        return;
      }
    }
    const validQuestions = quizQuestions.map(q => ({
      question: q.question,
      options: q.options,
    }));
    const res = await replaceAdminModuleQuiz(courseId, moduleId, validQuestions);
    if (res.success) {
      showToast('Quiz saved');
    } else {
      const msg = res.error && typeof res.error === 'object' ? (res.error.message || JSON.stringify(res.error)) : String(res.error || 'Unknown error');
      showToast('Quiz save failed: ' + msg, false);
    }
    setSaving(false);
  }

  function updateQuizQuestion(idx: number, field: 'question' | 'optionText', optIdx: number, value: string) {
    setQuizQuestions(prev => prev.map((q, qi) => {
      if (qi !== idx) return q;
      if (field === 'question') return { ...q, question: value };
      return {
        ...q,
        options: q.options.map((o, oi) =>
          oi === optIdx ? { ...o, text: value } : o
        ),
      };
    }));
    setDirty(true);
  }

  function setCorrectAnswer(qIdx: number, optIdx: number) {
    setQuizQuestions(prev => prev.map((q, qi) => {
      if (qi !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === optIdx })),
      };
    }));
    setDirty(true);
  }

  function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-8" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-6" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500" style={poppins}>Module not found</p>
        <Link href={`/admin/courses/${courseId}`} className="text-purple-600 hover:underline text-sm" style={poppins}>Back to Course</Link>
      </div>
    );
  }

  const videoId = form.youtubeUrl ? getYouTubeId(form.youtubeUrl) : null;

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm flex items-center gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`} style={poppins}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <Link href={`/admin/courses/${courseId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6 transition-colors" style={poppins}>
        <ArrowLeft className="w-4 h-4" /> Back to {courseName || 'Course'}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shrink-0" style={outfit}>
              {module.dayNumber}
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
              {module.title || `Day ${module.dayNumber}`}
            </h1>
          </div>
          <p className="text-gray-500 text-sm" style={poppins}>{courseName} · Day {module.dayNumber}</p>
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
          {tab === 'Basic Info' && (
            <form onSubmit={handleSaveBasic} className="space-y-5 max-w-2xl">
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Day #</label>
                  <input type="number" value={form.dayNumber} min={1} max={7}
                    onChange={e => { setForm(f => ({ ...f, dayNumber: parseInt(e.target.value) || 1 })); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Module Title</label>
                  <input type="text" value={form.title}
                    onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setDirty(true); }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFreePreview}
                    onChange={e => { setForm(f => ({ ...f, isFreePreview: e.target.checked })); setDirty(true); }}
                    className="w-5 h-5 rounded accent-purple-600"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-700" style={poppins}>Free Preview</span>
                    <p className="text-xs text-gray-500" style={poppins}>Students can access this module without enrolling</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={poppins}>Content (shown to students)</label>
                <textarea rows={6} value={form.contentText}
                  onChange={e => { setForm(f => ({ ...f, contentText: e.target.value })); setDirty(true); }}
                  placeholder="Instructions, reference material, or brief for this day…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900 resize-none font-mono" style={poppins} />
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

          {tab === 'Video & Notes' && (
            <form onSubmit={handleSaveMedia} className="space-y-6 max-w-2xl">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <label className="text-sm font-semibold text-gray-700" style={poppins}>YouTube Video URL</label>
                </div>
                <input type="url" value={form.youtubeUrl}
                  onChange={e => { setForm(f => ({ ...f, youtubeUrl: e.target.value })); setDirty(true); }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                {videoId && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 max-w-md aspect-video bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allowFullScreen
                      title="YouTube preview"
                    />
                  </div>
                )}
                {form.youtubeUrl && !videoId && (
                  <p className="text-xs text-amber-600 mt-1" style={poppins}>Enter a valid YouTube URL</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <label className="text-sm font-semibold text-gray-700" style={poppins}>Notes PDF URL</label>
                </div>
                <input type="url" value={form.notesPdfUrl}
                  onChange={e => { setForm(f => ({ ...f, notesPdfUrl: e.target.value })); setDirty(true); }}
                  placeholder="https://example.com/notes.pdf"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                {form.notesPdfUrl && (
                  <a href={form.notesPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline mt-1" style={poppins}>
                    Open PDF <span className="font-mono ml-1">{form.notesPdfUrl.substring(0, 40)}…</span>
                  </a>
                )}
              </div>

              <div className="flex gap-3 items-center">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${form.youtubeUrl ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`} style={poppins}>
                  {form.youtubeUrl ? 'Video ✓' : 'No Video'}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${form.notesPdfUrl ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`} style={poppins}>
                  {form.notesPdfUrl ? 'Notes ✓' : 'No Notes'}
                </span>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ ...poppins, fontWeight: 600 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Media'}
                </button>
              </div>
            </form>
          )}

          {tab === 'Quiz' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700" style={poppins}>5 Questions · 4 Options each</p>
                  <p className="text-xs text-gray-500" style={poppins}>Exactly 1 correct answer per question · Click the circle to mark correct</p>
                </div>
                <button onClick={handleSaveQuiz} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ ...poppins, fontWeight: 600 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Quiz
                </button>
              </div>

              <div className="space-y-5">
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0" style={outfit}>
                        {qi + 1}
                      </span>
                      <input type="text" value={q.question}
                        onChange={e => updateQuizQuestion(qi, 'question', 0, e.target.value)}
                        placeholder={`Question ${qi + 1}…`}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-gray-900" style={poppins} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswer(qi, oi)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-purple-400'}`}
                          >
                            {opt.isCorrect && <Check className="w-3 h-3" />}
                          </button>
                          <input type="text" value={opt.text}
                            onChange={e => updateQuizQuestion(qi, 'optionText', oi, e.target.value)}
                            placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}…`}
                            className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${opt.isCorrect ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-200 focus:ring-2 focus:ring-purple-500 text-gray-900'}`}
                            style={poppins} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveQuiz} disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ ...poppins, fontWeight: 600 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}