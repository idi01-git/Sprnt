'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Star, CheckCircle2, Sparkles, Award } from 'lucide-react';
import type { Course } from '@/lib/api';

interface CourseCardProps {
  course: Course;
  index?: number;
  popular?: boolean;
}

const getBranchGradient = (branch: string): string => {
  const normalized = branch.toLowerCase();
  if (normalized.includes('chemical')) return 'from-pink-500 to-rose-500';
  if (normalized.includes('civil')) return 'from-emerald-500 to-teal-500';
  if (normalized.includes('mechanical')) return 'from-purple-500 to-indigo-500';
  if (normalized.includes('electrical')) return 'from-blue-500 to-cyan-500';
  if (normalized.includes('electronic') || normalized.includes('ece')) return 'from-red-500 to-pink-500';
  if (normalized.includes('computer') || normalized.includes('it') || normalized.includes('cse') || normalized.includes('cs')) return 'from-green-500 to-emerald-500';
  return 'from-gray-500 to-slate-500';
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
};

export function CourseCard({ course, index = 0, popular = false }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const gradient = getBranchGradient(course.affiliatedBranch);
  const tags = Array.isArray(course.tags) ? course.tags : [];
  const features = tags.slice(0, 4);
  const tools = tags.slice(0, 3);

  // Calculate discount
  const originalPrice = Math.round(course.coursePrice * 1.5);
  const hasDiscount = course.coursePrice < originalPrice;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative group animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Popular Badge - Enhanced with Neon Glow */}
        {popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative">
              {/* Badge Neon Glow */}
              <div className="absolute inset-0 rounded-full blur-lg opacity-70"
                style={{ boxShadow: '0 0 30px rgba(251, 146, 60, 0.6)' }}
              />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg border border-yellow-300/50">
                <Sparkles className="w-4 h-4 text-white" />
                <span
                  className="text-white"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  MOST POPULAR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced 3D Shadow */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl transform translate-y-0 translate-x-0 group-hover:translate-y-1 group-hover:translate-x-1 transition-all duration-100 ease-out opacity-10`} 
        />

        {/* Multi-layer Neon Glow - Enhanced */}
        <div 
          className={`absolute -inset-3 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-700 ease-out`} 
        />
        <div 
          className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 ease-out`} 
        />

        {/* Glassmorphic Card Container - Enhanced */}
        <div 
          className="relative backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-500 ease-out hover:-translate-y-3 hover:-translate-x-3"
          style={{
            borderColor: isHovered ? (popular ? 'rgba(251, 191, 36, 0.5)' : 'rgba(168, 85, 247, 0.5)') : (popular ? 'rgba(251, 191, 36, 0.3)' : 'rgba(243, 244, 246, 0.5)'),
            background: isHovered
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.85) 100%)',
            boxShadow: isHovered
              ? '0 15px 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)'
              : '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Overall Shine Effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/50 to-white/0 transform -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-1000 ease-out"
            style={{ transform: 'rotate(-10deg) scale(2)' }}
          />

          {/* Header with Enhanced Gradient Background */}
          <div className={`relative p-4 bg-gradient-to-br ${gradient} overflow-hidden`}>
            {/* Animated Pattern */}
            <div className="absolute inset-0 opacity-3">
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} 
              />
            </div>

            {/* Shine effect on header */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" 
            />

            {/* Branch Badge & Rating */}
            <div className="relative flex items-center justify-between mb-4">
              <span
                className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-md text-white border border-white/40"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                {course.affiliatedBranch}
              </span>

              {/* Rating with enhanced glow */}
              <div 
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/30 backdrop-blur-md border border-white/40"
                style={{ boxShadow: isHovered ? '0 4px 6px rgba(250, 204, 21, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)' }}
              >
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span
                  className="text-white"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  5.0
                </span>
              </div>
            </div>

            {/* Title - Enhanced */}
            <h3
              className="text-white mb-3 relative"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(20px, 3vw, 24px)',
                lineHeight: '1.3',
                minHeight: '62px',
                textShadow: isHovered ? '0 2px 20px rgba(0, 0, 0, 0.2)' : 'none'
              }}
            >
              {course.courseName}
            </h3>

            {/* Tools - Enhanced */}
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-white/30 backdrop-blur-md text-white border border-white/40 hover:bg-white/40 transition-all duration-200"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '11px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Content - Enhanced */}
          <div className="p-6 relative">
            {/* Stats - Enhanced */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  14 Days
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  New
                </span>
              </div>
            </div>

            {/* Features with stagger animation - Enhanced */}
            <div className="space-y-3 mb-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 transition-all duration-300"
                  style={{
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    transitionDelay: `${idx * 50}ms`
                  }}
                >
                  <div 
                    className={`flex-shrink-0 w-5 h-5 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mt-0.5 transition-all duration-300`}
                    style={{
                      boxShadow: isHovered ? '0 4px 12px rgba(52, 211, 153, 0.4)' : '0 2px 8px rgba(52, 211, 153, 0.2)',
                      transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)'
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span
                    className="text-gray-600"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Section - Enhanced with 3D Effect */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: 'clamp(28px, 4vw, 32px)'
                    }}
                  >
                    {formatPrice(course.coursePrice)}
                  </span>
                  {hasDiscount && (
                    <span
                      className="text-gray-400 line-through"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: '16px'
                      }}
                    >
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span
                    className="text-green-600"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    Limited Time Offer
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced 3D CTA Button */}
            <button
              className={`relative w-full py-4 rounded-xl overflow-hidden group/btn transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
            >
              {/* 3D Shadow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-70 transform translate-y-1 group-hover/btn:translate-y-2 transition-all duration-300 rounded-xl`} />

              {/* Button Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />

              {/* Inner Highlight */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent" />

              <span
                className="relative flex items-center justify-center gap-2 text-white z-10"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px'
                }}
              >
                <Award className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                Enroll Now
              </span>
            </button>
          </div>

          {/* Decorative Corner with pulse */}
          <div 
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-bl-full transition-opacity duration-500`}
            style={{ opacity: isHovered ? 0.08 : 0.04 }}
          />
        </div>
      </div>
    </Link>
  );
}
