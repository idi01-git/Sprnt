'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Video,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Play,
  Clock,
  HelpCircle,
  Lock
} from 'lucide-react';
import { getDayContent, DayContent } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LearnDayPage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params.enrollmentId as string;
  const dayNumber = parseInt(params.dayNumber as string, 10) || 1;

  const [day, setDay] = useState<DayContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollmentId || !dayNumber) return;

    const fetchDay = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDayContent(enrollmentId, dayNumber);

        if (response.success && response.data) {
          setDay(response.data.day);
        } else {
          setError(response.error?.message || 'Failed to load day content');
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchDay();
    window.scrollTo(0, 0);
  }, [enrollmentId, dayNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500" style={{ ...poppins, fontWeight: 500 }}>Loading Day {dayNumber}…</p>
        </div>
      </div>
    );
  }

  if (error || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            Can't Access This Day
          </h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>
            {error || 'Content not found'}
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> My Learning
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm" style={{ ...poppins, fontWeight: 600 }}>
              Day {day.dayNumber} of 7
            </span>
            {day.quizPassed && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-400/30 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Quiz Passed
              </span>
            )}
          </div>

          <h1 style={{ ...outfit, fontWeight: 800, fontSize: 'clamp(24px, 4vw, 36px)' }}>
            {day.title}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {day.videoUrl && (
            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
              <div className="text-center text-white/70">
                <Play className="w-16 h-16 mx-auto mb-3 text-white/50" />
                <p className="text-sm" style={poppins}>Video Lecture</p>
                {day.isCompleted && <p className="text-xs text-green-400 mt-1" style={poppins}>Completed ✓</p>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <BookOpen className="w-5 h-5 text-purple-600" /> Lesson Content
            </h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line" style={{ ...poppins, fontSize: '15px', lineHeight: 1.8 }}>
              {day.description}
            </div>
          </div>

          {day.resources && day.resources.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 mb-2" style={{ ...poppins, fontWeight: 600 }}>Resources</h3>
              {day.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900" style={poppins}>{resource.title}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <HelpCircle className="w-5 h-5 text-purple-600" /> Day {day.dayNumber} Quiz
            </h3>

            {!day.isUnlocked ? (
              <div className="text-center py-4">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-semibold" style={poppins}>Complete Previous Day</p>
                <p className="text-sm text-gray-500 mt-1" style={poppins}>
                  Finish the quiz for Day {day.dayNumber - 1} to unlock this quiz.
                </p>
              </div>
            ) : day.quizPassed ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-semibold" style={poppins}>Quiz Passed!</p>
                {day.quizScore !== null && (
                  <p className="text-sm text-gray-500 mt-1" style={poppins}>
                    Score: {day.quizScore}%
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4" style={poppins}>
                  Pass the quiz to unlock Day {dayNumber + 1}.
                </p>
                <Link
                  href={`/quiz/${dayNumber}?enrollmentId=${enrollmentId}`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  <HelpCircle className="w-4 h-4" /> Start Quiz
                </Link>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {dayNumber > 1 && (
              <button
                onClick={() => router.push(`/learn/${enrollmentId}/day/${dayNumber - 1}`)}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                style={{ ...poppins, fontWeight: 500 }}
              >
                <ArrowLeft className="w-4 h-4" /> Day {dayNumber - 1}
              </button>
            )}
            {dayNumber < 7 && day.isUnlocked && (
              <button
                onClick={() => router.push(`/learn/${enrollmentId}/day/${dayNumber + 1}`)}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-sm transition-colors"
                style={{ ...poppins, fontWeight: 500 }}
              >
                Day {dayNumber + 1} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: 7 }, (_, i) => i + 1).map(d => (
              <button
                key={d}
                onClick={() => router.push(`/learn/${enrollmentId}/day/${d}`)}
                className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all ${d === dayNumber
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                style={{ ...poppins, fontWeight: 600 }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
