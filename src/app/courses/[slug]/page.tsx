import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getCourseBySlug } from '@/lib/api';
import { Clock, Award, Users, Sparkles, CheckCircle2, Play, FileText } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getCourseBySlug(slug);
  
  if (!res.success || !res.data?.course) {
    return { title: 'Course Not Found' };
  }
  
  const course = res.data.course;
  return {
    title: `${course.courseName} - Sprintern`,
    description: course.courseDescription,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await getCourseBySlug(slug);

  if (!res.success || !res.data?.course) {
    notFound();
  }

  const course = res.data.course;
  const tags = Array.isArray(course.tags) ? course.tags : [];
  const moduleCount = course._count?.modules || 7;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">FREE Day 1 Access</span>
                </div>

                <h1 
                  className="text-4xl md:text-5xl font-bold text-white mb-4"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {course.courseName}
                </h1>

                <p 
                  className="text-white/80 text-lg mb-6"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {course.courseDescription}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5" />
                    <span>7 Days</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5" />
                    <span>{moduleCount} Modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5" />
                    <span>Certificate</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-outfit)' }}>
                    ₹{course.coursePrice}
                  </span>
                  {course.coursePrice < 500 && (
                    <span className="text-xl text-white/60 line-through">
                      ₹{Math.round(course.coursePrice * 1.5)}
                    </span>
                  )}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/courses/${slug}/day-1`}
                    className="px-8 py-4 rounded-xl bg-yellow-400 text-purple-900 font-semibold hover:shadow-lg hover:shadow-yellow-400/30 transition-all hover:scale-105"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Try Day 1 for FREE
                  </Link>
                  <button
                    className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    Buy Full Course
                  </button>
                </div>
              </div>

              {/* Right - Preview Card */}
              <div className="hidden lg:block">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Play className="w-16 h-16 text-purple-600" />
                  </div>
                  <p className="text-center text-gray-600 font-medium">
                    Preview: Day 1 Content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* What You'll Learn */}
              <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                <h2 
                  className="text-2xl font-bold text-gray-900 mb-6"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  What You&apos;ll Learn
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">{tag}</span>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">Industry-relevant skills</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">Hands-on project experience</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">Verified certificate</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">Expert feedback</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Course Syllabus */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 
                  className="text-2xl font-bold text-gray-900 mb-6"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Course Syllabus
                </h2>
                <div className="space-y-4">
                  {Array.from({ length: moduleCount }, (_, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        i === 0 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          i === 0 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Day {i + 1}</p>
                          <p className="text-sm text-gray-500">
                            {i === 0 ? 'Free to preview' : 'Available after enrollment'}
                          </p>
                        </div>
                      </div>
                      {i === 0 ? (
                        <Link
                          href={`/courses/${slug}/day-1`}
                          className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                        >
                          Start Free
                        </Link>
                      ) : (
                        <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 font-medium">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h3 
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  This Course Includes
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Play className="w-5 h-5 text-purple-600" />
                    <span>{moduleCount} Video Modules</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Downloadable Notes</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Quiz for Each Day</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span>Verified Certificate</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Expert Support</span>
                  </li>
                </ul>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-4">
                    Have a question? Contact us at hello@sprintern.in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
