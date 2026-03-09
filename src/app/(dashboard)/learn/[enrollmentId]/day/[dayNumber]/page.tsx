'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { getDayContent, fetchApi, DayContent } from '@/lib/api';
import VideoPlayer from '@/components/video/VideoPlayer';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface DayProgress {
  dayNumber: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  quizPassed: boolean;
}

export default function LearnDayPage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params.enrollmentId as string;
  const dayNumber = parseInt(params.dayNumber as string, 10) || 1;

  const [day, setDay] = useState<DayContent | null>(null);
  const [allDays, setAllDays] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const navigateDay = useCallback((d: number) => {
    router.push(`/learn/${enrollmentId}/day/${d}`);
    setSidebarOpen(false);
  }, [router, enrollmentId]);

  useEffect(() => {
    if (!enrollmentId || !dayNumber) return;

    const fetchDay = async () => {
      setLoading(true);
      setError(null);
      setSignedUrl(null);
      try {
        const response = await getDayContent(enrollmentId, dayNumber);
        if (response.success && response.data) {
          const dayData = response.data.day;
          setDay(dayData);

          // Get signed video URL if videoId exists
          if (dayData.videoId) {
            const urlRes = await fetchApi<{ url: string; expiresAt: string }>(
              `/api/video/${dayData.videoId}/signed-url`
            );
            if (urlRes.success && urlRes.data) {
              setSignedUrl(urlRes.data.url);
            }
          } else if (dayData.videoUrl) {
            setSignedUrl(dayData.videoUrl);
          }
        } else {
          setError(response.error?.message || 'Failed to load day content');
        }

        // Fetch progress for all 7 days for sidebar
        const progressRes = await fetchApi<{ days: DayProgress[] }>(
          `/api/enrollments/${enrollmentId}/progress`
        );
        if (progressRes.success && progressRes.data) {
          setAllDays(progressRes.data.days);
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

  const handleVideoProgress = useCallback(({ percent }: { currentTime: number; duration: number; percent: number }) => {
    setVideoProgress(Math.round(percent));
  }, []);

  const handleVideoEnded = useCallback(async () => {
    // Mark video as watched via API
    if (day?.videoId) {
      await fetchApi(`/api/video/${day.videoId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ percent: 100, completed: true }),
      });
    }
  }, [day]);

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
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>Can't Access This Day</h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>{error || 'Content not found'}</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all" style={{ ...poppins, fontWeight: 600 }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Build sidebar items — fallback to 7 generic days if API didn't return progress
  const sidebarDays: DayProgress[] = allDays.length > 0 ? allDays : Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    title: `Day ${i + 1}`,
    isUnlocked: i + 1 <= dayNumber,
    isCompleted: i + 1 < dayNumber,
    quizPassed: i + 1 < dayNumber,
  }));

  return (
    <div className="min-h-screen pt-20 pb-16 flex">

      {/* ── LEFT SIDEBAR ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-20 left-0 h-[calc(100vh-80px)] w-64 bg-white border-r border-gray-100 shadow-lg z-40
        transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none
      `}>
        <div className="p-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-5 transition-colors"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3" style={poppins}>
            Course Progress
          </h3>

          <div className="space-y-1">
            {sidebarDays.map((d) => {
              const isCurrent = d.dayNumber === dayNumber;
              const isLocked = !d.isUnlocked;
              return (
                <button
                  key={d.dayNumber}
                  onClick={() => !isLocked && navigateDay(d.dayNumber)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                      : isLocked
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? 'bg-white/20 text-white'
                      : d.isCompleted ? 'bg-green-100 text-green-600'
                        : isLocked ? 'bg-gray-100 text-gray-300'
                          : 'bg-purple-100 text-purple-600'
                    }`}>
                    {d.isCompleted && !isCurrent ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : d.dayNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${isCurrent ? 'text-white font-semibold' : ''}`} style={poppins}>
                      {d.title || `Day ${d.dayNumber}`}
                    </p>
                    {d.quizPassed && !isCurrent && (
                      <p className="text-[10px] text-green-500" style={poppins}>Quiz passed ✓</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Project link after Day 7 */}
          {sidebarDays.find(d => d.dayNumber === 7)?.quizPassed && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/dashboard/submit?enrollmentId=${enrollmentId}`}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-xs hover:bg-purple-100 transition-colors"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <ArrowRight className="w-4 h-4" /> Submit Project
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 min-w-0">

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 rounded-full bg-white/20 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                  Day {day.dayNumber} of 7
                </span>
                {day.quizPassed && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-400/30 text-sm" style={{ ...poppins, fontWeight: 600 }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Quiz Passed
                  </span>
                )}
                {videoProgress > 0 && videoProgress < 100 && (
                  <span className="text-white/70 text-sm" style={poppins}>{videoProgress}% watched</span>
                )}
              </div>
              <h1 style={{ ...outfit, fontWeight: 800, fontSize: 'clamp(20px, 3.5vw, 30px)' }}>
                {day.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6 pb-16">
          {/* Video Player */}
          {signedUrl ? (
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <VideoPlayer
                src={signedUrl}
                title={day.title}
                onProgress={handleVideoProgress}
                onEnded={handleVideoEnded}
              />
            </div>
          ) : day.videoUrl || day.videoId ? (
            <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center text-white/50">
                <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin" />
                <p className="text-sm" style={poppins}>Loading video…</p>
              </div>
            </div>
          ) : null}

          {/* Lesson Content */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <BookOpen className="w-5 h-5 text-purple-600" /> Lesson Content
            </h2>
            <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" style={{ ...poppins, fontSize: '15px', lineHeight: 1.85 }}>
              {day.content || day.description}
            </div>
          </div>

          {/* Downloadable Resources */}
          {day.resources && day.resources.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider" style={poppins}>Downloads</h3>
              <div className="space-y-2">
                {day.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors" style={poppins}>
                      {resource.title}
                    </p>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 ml-auto transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
              <HelpCircle className="w-5 h-5 text-purple-600" /> Day {day.dayNumber} Quiz
            </h3>

            {!day.isUnlocked ? (
              <div className="flex flex-col items-center text-center py-6">
                <Lock className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-600 font-semibold" style={poppins}>Complete Previous Day First</p>
                <p className="text-sm text-gray-500 mt-1" style={poppins}>
                  Pass the quiz for Day {day.dayNumber - 1} to unlock this content.
                </p>
              </div>
            ) : day.quizPassed ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-green-700 font-semibold" style={poppins}>Quiz Passed! 🎉</p>
                {day.quizScore !== null && (
                  <p className="text-sm text-gray-500 mt-1" style={poppins}>Your score: {day.quizScore}%</p>
                )}
                {dayNumber < 7 && (
                  <button
                    onClick={() => navigateDay(dayNumber + 1)}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-sm hover:bg-purple-100 transition-colors"
                    style={{ ...poppins, fontWeight: 600 }}
                  >
                    Continue to Day {dayNumber + 1} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {dayNumber === 7 && (
                  <Link
                    href={`/dashboard/submit?enrollmentId=${enrollmentId}`}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg transition-all"
                    style={{ ...poppins, fontWeight: 600 }}
                  >
                    Submit Your Project <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-6">
                <HelpCircle className="w-12 h-12 text-purple-300 mb-3" />
                <p className="text-gray-700 font-semibold mb-1" style={{ ...poppins, fontWeight: 600 }}>Ready to test your knowledge?</p>
                <p className="text-sm text-gray-500 mb-5" style={poppins}>
                  Pass with ≥ 4/5 to unlock Day {dayNumber < 7 ? dayNumber + 1 : 'submission'}.
                </p>
                <Link
                  href={`/quiz/${dayNumber}?enrollmentId=${enrollmentId}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  <HelpCircle className="w-4 h-4" /> Start Quiz
                </Link>
              </div>
            )}
          </div>

          {/* Day Navigation */}
          <div className="flex gap-3">
            {dayNumber > 1 && (
              <button
                onClick={() => navigateDay(dayNumber - 1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                style={{ ...poppins, fontWeight: 500 }}
              >
                <ArrowLeft className="w-4 h-4" /> Day {dayNumber - 1}
              </button>
            )}
            {dayNumber < 7 && (
              <button
                onClick={() => navigateDay(dayNumber + 1)}
                disabled={!day.quizPassed && dayNumber < 7}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${day.quizPassed
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                style={{ ...poppins, fontWeight: 600 }}
              >
                Day {dayNumber + 1} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
