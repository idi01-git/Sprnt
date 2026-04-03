'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

interface Day1Content {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  videoUrl: string | null;
  content: string;
  resources: { title: string; url: string }[];
  quiz: {
    questions: QuizQuestion[];
    passingScore: number;
    totalQuestions: number;
  } | null;
}

interface QuizResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
}

export default function Day1PreviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [content, setContent] = useState<Day1Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    const fetchDay1 = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${slug}/modules/day-1/preview`, {
          credentials: 'include'
        });
        const json = await res.json().catch(() => ({}));
        
        if (res.ok && json.success && json.data?.day) {
          setContent(json.data.day);
        } else {
          setError(json.error?.message || 'Failed to load Day 1 content');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchDay1();
  }, [slug]);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleQuizSubmit = () => {
    if (!content?.quiz) return;
    
    const allAnswered = content.quiz.questions.every(q => answers[q.id] !== undefined);
    if (!allAnswered) return;

    const correctCount = content.quiz.questions.reduce((count, q) => {
      return count + (answers[q.id] === q.correctOptionIndex ? 1 : 0);
    }, 0);

    const passed = correctCount >= content.quiz.passingScore;
    
    setQuizResult({
      score: correctCount,
      passed,
      totalQuestions: content.quiz.questions.length
    });
  };

  const resetQuiz = () => {
    setAnswers({});
    setQuizResult(null);
    setCurrentQ(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500" style={{ ...poppins, fontWeight: 500 }}>Loading Day 1…</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ ...outfit, fontWeight: 800 }}>
            Unable to Load Content
          </h2>
          <p className="text-gray-500" style={{ ...poppins, fontSize: '15px' }}>
            {error || 'Day 1 content is not available yet.'}
          </p>
          <Link
            href="/courses"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  if (quizMode) {
    return (
      <Day1QuizMode
        content={content}
        answers={answers}
        quizResult={quizResult}
        currentQ={currentQ}
        onAnswer={handleAnswer}
        onSubmit={handleQuizSubmit}
        onBack={() => setQuizMode(false)}
        onQuestionChange={setCurrentQ}
        onRetry={resetQuiz}
        courseSlug={slug}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-300 text-sm" style={{ ...poppins, fontWeight: 600 }}>
              FREE Preview
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm" style={{ ...poppins, fontWeight: 600 }}>
              Day 1 of 7
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ ...outfit, fontWeight: 800 }}>
            {content.title}
          </h1>
          <p className="text-white/80" style={{ ...poppins }}>
            Complete this lesson and quiz to unlock Days 2-7
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Video Section */}
        {content.videoUrl && (
          <div className="mb-8">
            <VideoPlayer videoUrl={content.videoUrl} title={content.title} className="w-full" />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ ...outfit, fontWeight: 700 }}>
            <BookOpen className="w-5 h-5 text-purple-600" /> Lesson Content
          </h2>
          <div className="text-gray-600 leading-relaxed whitespace-pre-line" style={{ ...poppins, fontSize: '15px', lineHeight: 1.8 }}>
            {content.description}
          </div>
        </div>

        {/* Resources */}
        {content.resources && content.resources.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ ...outfit, fontWeight: 700 }}>
              Download Resources
            </h2>
            <div className="space-y-2">
              {content.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700" style={poppins}>{resource.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quiz CTA */}
        {content.quiz && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ ...outfit, fontWeight: 700 }}>
                  Day 1 Quiz
                </h3>
                <p className="text-gray-600" style={{ ...poppins, fontSize: '14px' }}>
                  {content.quiz.questions.length} questions • Pass with {content.quiz.passingScore} correct
                </p>
              </div>
              <button
                onClick={() => setQuizMode(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                style={{ ...poppins, fontWeight: 600 }}
              >
                Take Quiz <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Purchase CTA */}
        <div className="mt-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-200 text-center">
          <p className="text-gray-700 mb-4" style={{ ...poppins }}>
            Enjoying Day 1? Unlock all 7 days and get your certificate!
          </p>
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-purple-900 font-semibold hover:shadow-lg hover:shadow-yellow-400/30"
            style={{ ...poppins, fontWeight: 600 }}
          >
            Buy Full Course
          </Link>
        </div>
      </div>
    </div>
  );
}

function Day1QuizMode({
  content,
  answers,
  quizResult,
  currentQ,
  onAnswer,
  onSubmit,
  onBack,
  onQuestionChange,
  onRetry,
  courseSlug
}: {
  content: Day1Content;
  answers: Record<number, number>;
  quizResult: QuizResult | null;
  currentQ: number;
  onAnswer: (qId: number, optionIndex: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  onQuestionChange: (q: number) => void;
  onRetry: () => void;
  courseSlug: string;
}) {
  if (!content.quiz) return null;

  if (quizResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          {quizResult.passed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2" style={{ ...outfit, fontWeight: 800 }}>
                Quiz Passed!
              </h2>
              <p className="text-gray-500 mb-2" style={poppins}>
                Score: {quizResult.score}/{quizResult.totalQuestions}
              </p>
              <p className="text-purple-600 font-semibold mb-6" style={poppins}>
                Day 2-7 unlocked! Purchase to continue.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  style={{ ...poppins, fontWeight: 500 }}
                >
                  Back to Lesson
                </button>
                <Link
                  href={`/courses/${courseSlug}`}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  Buy Course
                </Link>
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
              <p className="text-gray-500 mb-6" style={poppins}>
                Score: {quizResult.score}/{quizResult.totalQuestions}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  style={{ ...poppins, fontWeight: 500 }}
                >
                  Back to Lesson
                </button>
                <button
                  onClick={onRetry}
                  className="px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const q = content.quiz.questions[currentQ];
  const allAnswered = content.quiz.questions.every(q => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-4"
          style={{ ...poppins, fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to lesson
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1" style={{ ...outfit, fontWeight: 800 }}>
          Day 1 Quiz
        </h1>
        <p className="text-gray-500 mb-6" style={{ ...poppins, fontSize: '14px' }}>
          {content.quiz.questions.length} questions • Pass with {content.quiz.passingScore} correct
        </p>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {content.quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => onQuestionChange(i)}
              className={`flex-1 h-2 rounded-full transition-all ${
                i === currentQ
                  ? 'bg-purple-600'
                  : answers[content.quiz!.questions[i].id] !== undefined
                    ? 'bg-green-400'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm mb-6">
          <p className="text-xs text-purple-600 font-semibold mb-3" style={poppins}>
            QUESTION {currentQ + 1} OF {content.quiz.questions.length}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ ...outfit, fontWeight: 700 }}>
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              const isSelected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(q.id, i)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-100 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                  style={{ ...poppins, fontWeight: isSelected ? 600 : 400, fontSize: '15px' }}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`} style={{ ...poppins, fontWeight: 700 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => onQuestionChange(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            style={{ ...poppins, fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Previous
          </button>

          {currentQ < content.quiz.questions.length - 1 ? (
            <button
              onClick={() => onQuestionChange(currentQ + 1)}
              className="px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100"
              style={{ ...poppins, fontWeight: 600 }}
            >
              Next <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!allAnswered}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 flex items-center gap-2"
              style={{ ...poppins, fontWeight: 600 }}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}