import { Suspense, memo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CourseCatalog } from '@/components/landing/CourseCatalog';
import { getCourses, getBranches } from '@/lib/api';
import { validateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// Memoized CourseCatalog to prevent unnecessary re-renders
const MemoizedCourseCatalog = memo(CourseCatalog);

export const metadata = {
  title: 'Courses - Sprintern',
  description: 'Explore our virtual industrial internship courses for core engineering students.',
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const branch = params.branch || '';
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);

  const [coursesRes, branchesRes] = await Promise.all([
    getCourses({ page, limit: 12, branch, search }),
    getBranches(),
  ]);

  // Memoize to ensure stable references across re-renders
  const initialCourses = coursesRes.success ? coursesRes.data?.courses ?? [] : [];
  const initialBranches = branchesRes.success ? branchesRes.data?.branches ?? [] : [];

  // Get enrolled course IDs for logged-in user to filter them out
  let enrolledCourseIds: string[] = [];
  const { user } = await validateRequest();
  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        paymentStatus: 'success',
        deletedAt: null,
      },
      select: {
        course: {
          select: {
            courseId: true,
          },
        },
      },
    });
    // Sort for stable reference when content is same
    enrolledCourseIds = enrollments.map(e => e.course.courseId).sort();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h1
              className="text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Our Courses
            </h1>
            <p
              className="text-white/80 text-lg max-w-2xl"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Start with Day 1 for FREE. No login required. Experience our learning methodology before you buy.
            </p>
          </div>
        </div>

        {/* Course Catalog */}
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
          <MemoizedCourseCatalog
            initialCourses={initialCourses}
            initialBranches={initialBranches}
            enrolledCourseIds={enrolledCourseIds}
          />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
