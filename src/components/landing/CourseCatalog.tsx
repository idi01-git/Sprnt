'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';
import { getCourses, getBranches, type Course, type Branch } from '@/lib/api';
import StatsLoop from './StatsLoop';

interface CourseCatalogProps {
  initialCourses?: Course[];
  initialBranches?: Branch[];
}

export function CourseCatalog({ initialCourses, initialBranches }: CourseCatalogProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [branches, setBranches] = useState<Branch[]>(initialBranches || []);
  const [loading, setLoading] = useState(!initialCourses);
  const [error, setError] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = ['All', 'Chemical', 'Civil', 'Mechanical', 'Electrical', 'Electronic', 'CSE/IT'];

  useEffect(() => {
    if (initialCourses && initialBranches) return;
    
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [coursesRes, branchesRes] = await Promise.all([
          getCourses({ page: 1, limit: 50 }),
          getBranches(),
        ]);

        if (coursesRes.success && coursesRes.data) {
          setCourses(coursesRes.data.courses);
          setTotalPages(coursesRes.pagination?.totalPages || 1);
        } else {
          setError(coursesRes.error?.message || 'Failed to load courses');
        }

        if (branchesRes.success && branchesRes.data) {
          setBranches(branchesRes.data.branches);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [initialCourses, initialBranches]);

  const filteredCourses = activeCategory === 'All'
    ? courses
    : courses.filter(course => 
        course.affiliatedBranch.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]) ||
        activeCategory.toLowerCase().includes(course.affiliatedBranch.toLowerCase())
      );

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handlePageChange = async (newPage: number) => {
    setLoading(true);
    try {
      const res = await getCourses({ page: newPage, limit: 12 });
      
      if (res.success && res.data) {
        setCourses(res.data.courses);
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="courses" className="py-24 relative overflow-hidden bg-white">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-50/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-50/50 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">

        {/* Section Header - Enhanced */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 mb-4 animate-fade-in">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700 tracking-wide uppercase">
              Industry-Ready Certification
            </span>
          </div>

          <h2
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 mb-6"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Explore Our Course Catalog
          </h2>
          
          {/* Enhanced Filter */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in animation-delay-200">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
              <Filter className="w-4 h-4 text-gray-600" />
              <span
                className="text-gray-600"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Filter:
              </span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-purple-200'
                }`}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar - Animated Loop */}
        <StatsLoop />

        {/* Error State - Enhanced */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-8 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State - Enhanced */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading courses...</p>
            </div>
          </div>
        )}

        {/* Course Grid - Enhanced */}
        {!loading && !error && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  index={index}
                  // Mark first course as popular for demo
                  popular={index === 0 && activeCategory === 'All'}
                />
              ))}
            </div>

            {/* Empty State - Enhanced */}
            {filteredCourses.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No courses found</p>
                <p className="text-gray-400 text-sm">Try selecting a different category</p>
              </div>
            )}

            {/* Bottom CTA - Enhanced */}
            <div className="text-center animate-fade-in animation-delay-400">
              <p
                className="text-gray-600 mb-6"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: '16px'
                }}
              >
                Can't find your specialization? We're constantly adding new courses!
              </p>
              <button
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95"
              >
                <span
                  className="flex items-center gap-2"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  Request a Course
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </div>

            {/* Pagination - Enhanced */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
