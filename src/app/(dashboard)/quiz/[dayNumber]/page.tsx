'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import { fetchApi, Quiz, QuizResult, QuizResultResponse } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface QuizResultData {
  passed: boolean;
  score: number;
  percentage: number;
  nextDayUnlocked: boolean;
  cooldownUntil: string | null;
  attemptNumber: number;
  dayNumber: number;
}

interface DayContent {
  dayNumber: number;
  title: string;
  moduleId: string;
  quiz: {
    attempted: boolean;
    passed: boolean;
    attempts: number;
    cooldownUntil: string | null;
    cooldownActive: boolean;
  };
}

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const dayNumber = parseInt(params.dayNumber as string, 10) || 1;
  const enrollmentId = searchParams.get('enrollmentId') || '';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (!dayNumber || !enrollmentId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const learnRes = await fetchApi<{ day: DayContent }>(
          `/api/learn/${enrollmentId}/day/${dayNumber}`
        );

        if (!learnRes.success || !learnRes.data?.day) {
          setError(learnRes.error?.message || 'Failed to load day content');
          setLoading(false);
          return;
        }

        const dayContent = learnRes.data.day;
        const moduleId = dayContent.moduleId;

        if (!moduleId) {
          setError('Module not found for this day');
          setLoading(false);
          return;
        }

        const quizRes = await fetchApi<{ quiz: Quiz }>(
          `/api/quiz/${moduleId}?enrollmentId=${enrollmentId}`
        );

        if (quizRes.success && quizRes.data) {
          setQuiz(quizRes.data.quiz);
        } else {
          setError(quizRes.error?.message || 'Failed to load quiz');
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [dayNumber, enrollmentId]);

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz || !enrollmentId) return;

    const allAnswered = quiz.questions.every(q => answers[q.id]);
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const orderedAnswers = quiz.questions.map((q, idx) => {
        const selectedOption = answers[q.id];
        return quiz.questions[idx].options.indexOf(selectedOption);
      });

      const response = await fetchApi<QuizResultResponse>(
        `/api/quiz/${quiz.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: orderedAnswers }),
        }
      );

      if (response.success && response.data) {
        const resultData = response.data.result;
        setResult({
          passed: resultData.passed,
          score: resultData.score,
          percentage: Math.round((resultData.score / resultData.totalQuestions) * 100),
          nextDayUnlocked: resultData.passed,
          cooldownUntil: null,
          attemptNumber: 1,
          dayNumber: dayNumber,
        });
      } else {
        setError(response.error?.message || 'Failed to submit quiz');
      }
    } catch (err: any) {
      setError('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500" style={{ ...poppins, fontWeight: 500 }}>Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            Quiz Unavailable
          </h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          {result.passed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                Quiz Passed!
              </h2>
              <p className="text-gray-500 mb-4" style={poppins}>
                Score: {result.score} — {result.percentage}%
              </p>
              {result.nextDayUnlocked && (
                <p className="text-purple-600 font-semibold mb-6" style={poppins}>
                  Day {result.dayNumber + 1} has been unlocked!
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push(`/learn/${enrollmentId}/day/${result.dayNumber}`)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                  style={{ ...poppins, fontWeight: 500 }}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Day {result.dayNumber}
                </button>
                {result.nextDayUnlocked && (
                  <button
                    onClick={() => router.push(`/learn/${enrollmentId}/day/${result.dayNumber + 1}`)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg"
                    style={{ ...poppins, fontWeight: 600 }}
                  >
                    Day {result.dayNumber + 1} <ArrowRight className="w-4 h-4 inline ml-1" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                Not Quite!
              </h2>
              <p className="text-gray-500 mb-2" style={poppins}>
                Score: {result.score} — {result.percentage}%
              </p>
              <p className="text-sm text-gray-400 mb-6" style={poppins}>
                Attempt #{result.attemptNumber}
                {result.cooldownUntil && (
                  <>
                    <br />
                    <Clock className="w-3 h-3 inline mr-1" />
                    Try again after {new Date(result.cooldownUntil).toLocaleTimeString()}
                  </>
                )}
              </p>
              <button
                onClick={() => router.push(`/learn/${enrollmentId}/day/${result.dayNumber}`)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                style={{ ...poppins, fontWeight: 600 }}
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Lesson
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const q = quiz.questions[currentQ];
  const allAnswered = quiz.questions.every(q => answers[q.id]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors text-sm mb-4"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to lesson
          </button>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1" style={{ ...outfit, fontWeight: 800 }}>
            Day {quiz.dayNumber} Quiz
          </h1>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '14px' }}>
            {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
            {quiz.timeLimit && ` · ${Math.floor(quiz.timeLimit / 60)} min time limit`}
          </p>
        </div>

        <div className="flex gap-1.5 mb-6">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`flex-1 h-2 rounded-full transition-all ${i === currentQ
                  ? 'bg-purple-600'
                  : answers[quiz.questions[i].id]
                    ? 'bg-green-400'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm mb-6">
          <p className="text-xs text-purple-600 font-semibold mb-3" style={poppins}>
            QUESTION {currentQ + 1} OF {quiz.questions.length}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ ...outfit, fontWeight: 700 }}>
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              const isSelected = answers[q.id] === option;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(q.id, option)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-100 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/50'
                    }`}
                  style={{ ...poppins, fontWeight: isSelected ? 600 : 400, fontSize: '15px' }}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm ${isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                    }`} style={{ ...poppins, fontWeight: 700 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm" style={poppins}>
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Previous
          </button>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-sm"
              style={{ ...poppins, fontWeight: 600 }}
            >
              Next <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ ...poppins, fontWeight: 600 }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                <><Award className="w-4 h-4" /> Submit Quiz</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
