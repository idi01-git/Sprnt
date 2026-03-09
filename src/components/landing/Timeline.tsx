'use client';

import React, { useState } from 'react';
import { Calendar, Zap, Target, Trophy, ChevronRight, CheckCircle2, Rocket, BookOpen, Code } from 'lucide-react';
import StatsLoop from './StatsLoop';

interface DayItem {
  day: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  activities: string[];
}

export function Timeline() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const roadmap: DayItem[] = [
    {
      day: 'Day 1-2',
      phase: 'Getting Started',
      title: 'Onboarding & Setup',
      description: 'Complete orientation and prepare your learning environment',
      icon: Rocket,
      color: 'from-violet-500 to-purple-600',
      activities: [
        'Platform walkthrough & orientation',
        'Software installation & configuration',
        'Access course materials & resources',
        'Meet your mentor & cohort'
      ]
    },
    {
      day: 'Day 3-5',
      phase: 'Foundation',
      title: 'Core Concepts',
      description: 'Master fundamental theories and basic tool operations',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      activities: [
        'Video lectures on fundamentals',
        'Interactive tool demonstrations',
        'Guided practice exercises',
        'Knowledge check quizzes'
      ]
    },
    {
      day: 'Day 6-8',
      phase: 'Application',
      title: 'Hands-On Practice',
      description: 'Apply concepts through structured practical sessions',
      icon: Code,
      color: 'from-cyan-500 to-blue-600',
      activities: [
        'Real-world case studies',
        'Step-by-step tutorials',
        'Problem-solving exercises',
        'Peer collaboration sessions'
      ]
    },
    {
      day: 'Day 9-11',
      phase: 'Project Work',
      title: 'Industrial Project',
      description: 'Design and build your capstone engineering project',
      icon: Target,
      color: 'from-emerald-500 to-teal-600',
      activities: [
        'Project specification analysis',
        'Design & planning phase',
        'Implementation with tools',
        'Mentor feedback & iterations'
      ]
    },
    {
      day: 'Day 12-13',
      phase: 'Refinement',
      title: 'Optimization & Review',
      description: 'Perfect your project and prepare documentation',
      icon: Zap,
      color: 'from-orange-500 to-amber-600',
      activities: [
        'Project optimization',
        'Documentation completion',
        'Quality assurance testing',
        'Presentation preparation'
      ]
    },
    {
      day: 'Day 14',
      phase: 'Completion',
      title: 'Certification',
      description: 'Final submission and receive verified certificate',
      icon: Trophy,
      color: 'from-pink-500 to-rose-600',
      activities: [
        'Final project submission',
        'Faculty evaluation & review',
        'Receive detailed feedback',
        'Claim verified certificate'
      ]
    }
  ];

  return (
    <section id="roadmap" className="relative py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 relative group">
            {/* Enhanced Glassmorphic Badge with Neon */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-full border border-purple-300/50"
              style={{ boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1), inset 0 0 15px rgba(139, 92, 246, 0.03)' }}
            />
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.2), 0 0 30px rgba(139, 92, 246, 0.1)' }}
            />
            <Calendar className="w-5 h-5 text-purple-600 relative z-10" />
            <span
              className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent relative z-10"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px'
              }}
            >
              YOUR LEARNING PATH
            </span>
          </div>

          <h2
            className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(36px, 7vw, 56px)',
              lineHeight: '1.1'
            }}
          >
            14-Day Learning Roadmap
          </h2>

          <p
            className="text-gray-600 max-w-3xl mx-auto"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(16px, 2.5vw, 18px)',
              lineHeight: '1.7'
            }}
          >
            A structured, intensive program designed to transform you into an industry-ready engineer in just two weeks
          </p>
        </div>

        {/* Stats Bar - Animated Loop */}
        <StatsLoop />

        {/* Timeline Cards - Enhanced */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {roadmap.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredDay === index;

            return (
              <div
                key={index}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Enhanced 3D Shadow with smooth motion */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 rounded-3xl transform translate-y-0 translate-x-0 group-hover:translate-y-1 group-hover:translate-x-1 transition-all duration-100 ease-out blur-sm`}
                />

                {/* Multi-layer Neon Glow */}
                <div
                  className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-700 ease-out`}
                />
                <div
                  className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 ease-out`}
                />

                {/* Enhanced Glassmorphic Card */}
                <div
                  className="relative backdrop-blur-2xl rounded-3xl overflow-hidden border transition-all duration-500 ease-out hover:-translate-y-3 hover:-translate-x-3"
                  style={{
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                    background: isHovered
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    boxShadow: isHovered
                      ? '0 15px 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.3)'
                      : '0 4px 16px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {/* Enhanced Shine Effect - Diagonal sweep */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/60 to-white/0 transform -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-1000 ease-out"
                    style={{ transform: 'rotate(-10deg) scale(2)' }}
                  />

                  {/* Gradient Top Border with Neon pulse */}
                  <div
                    className={`h-1.5 bg-gradient-to-r ${item.color} relative overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out`} />
                    {isHovered && (
                      <div className="absolute inset-0 animate-pulse"
                        style={{ boxShadow: `0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4)` }}
                      />
                    )}
                  </div>

                  <div className="p-6 md:p-8 relative">
                    {/* Icon & Day Badge */}
                    <div className="flex items-center justify-between mb-6">
                      {/* Enhanced 3D Icon */}
                      <div
                        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center transition-all duration-500 ease-out`}
                        style={{
                          boxShadow: isHovered
                            ? '0 8px 20px rgba(139, 92, 246, 0.25), inset 0 -4px 8px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(255, 255, 255, 0.2)'
                            : '0 4px 12px rgba(139, 92, 246, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.08)',
                          transform: isHovered ? 'scale(1.1) rotate(6deg) translateZ(20px)' : 'scale(1) rotate(0deg) translateZ(0)',
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        <Icon className="w-8 h-8 text-white relative z-10 transition-transform duration-300"
                          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                        />
                        {/* Multi-layer inner glow */}
                        <div className="absolute inset-2 rounded-xl bg-white/20" />
                        <div className="absolute inset-3 rounded-lg bg-white/10" />
                      </div>

                      {/* Enhanced Day Badge */}
                      <div className="backdrop-blur-xl px-4 py-2 rounded-xl bg-white/70 border border-white/80 group-hover:border-white/90 transition-all duration-300 group-hover:scale-105"
                        style={{ boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}
                      >
                        <span
                          className={`bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '13px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {item.day}
                        </span>
                      </div>
                    </div>

                    {/* Phase Label with glow */}
                    <div className="mb-3">
                      <span
                        className={`text-purple-600 relative inline-block transition-all duration-300`}
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: '12px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          textShadow: isHovered ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                        }}
                      >
                        {item.phase}
                      </span>
                    </div>

                    {/* Title with smooth color transition */}
                    <h3
                      className={`text-gray-900 mb-3 transition-all duration-500 ${isHovered ? 'bg-gradient-to-r ' + item.color + ' bg-clip-text text-transparent' : ''}`}
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: 'clamp(18px, 3vw, 22px)',
                        lineHeight: '1.3',
                        textShadow: isHovered ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-gray-600 mb-6 transition-colors duration-300"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                    >
                      {item.description}
                    </p>

                    {/* Activities with stagger animation */}
                    <div className="space-y-2.5">
                      {item.activities.map((activity, actIdx) => (
                        <div
                          key={actIdx}
                          className="flex items-start gap-2.5 group/item transition-all duration-300"
                          style={{
                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                            transitionDelay: `${actIdx * 50}ms`
                          }}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mt-0.5 transition-all duration-300`}
                            style={{
                              boxShadow: isHovered ? `0 2px 6px rgba(139, 92, 246, 0.25)` : '0 1px 4px rgba(139, 92, 246, 0.15)',
                              transform: isHovered ? 'scale(1.1) rotate(3deg)' : 'scale(1) rotate(0deg)'
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span
                            className="text-gray-700 flex-1 transition-colors duration-300"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 400,
                              fontSize: '13px',
                              lineHeight: '1.5'
                            }}
                          >
                            {activity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decorative Corner Gradient with pulse */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} rounded-bl-full transition-opacity duration-500`}
                    style={{ opacity: isHovered ? 0.1 : 0.05 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA - Enhanced */}
        <div className="text-center animate-fade-in animation-delay-600">
          <div className="relative inline-block group">
            {/* Multi-layer Neon Glow */}
            <div
              className="absolute -inset-6 rounded-3xl opacity-0 group-hover:opacity-50 transition-all duration-700 blur-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
              }}
            />
            <div
              className="absolute -inset-4 rounded-3xl opacity-30 group-hover:opacity-50 transition-all duration-500 blur-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4))'
              }}
            />

            {/* Enhanced Glassmorphic Container */}
            <div className="relative backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/50 bg-gradient-to-br from-white/90 to-white/70 group-hover:from-white/95 group-hover:to-white/85 transition-all duration-500"
              style={{
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Animated background shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />

              <h3
                className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3 relative"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(24px, 4vw, 32px)'
                }}
              >
                Ready to Start Your Journey?
              </h3>
              <p
                className="text-gray-600 mb-8 max-w-2xl mx-auto relative"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  lineHeight: '1.6'
                }}
              >
                Join 15,000+ students who completed this roadmap and landed opportunities at top companies
              </p>

              {/* Enhanced 3D CTA Button */}
              <button className="relative group/btn inline-block">
                {/* 3D Shadow layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-blue-800 rounded-2xl transform translate-y-1 translate-x-1 group-hover/btn:translate-y-2 group-hover/btn:translate-x-2 transition-all duration-300 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-2xl transform translate-y-0.5 translate-x-0.5 opacity-50" />

                {/* Button */}
                <div className="relative px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 overflow-hidden group-hover/btn:-translate-y-1 group-hover/btn:-translate-x-1 group-hover/btn:scale-105 transition-all duration-300 ease-out"
                  style={{ boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25), inset 0 -2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}
                >
                  {/* Animated Shine - Multiple layers */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />

                  <span
                    className="relative flex items-center gap-3 text-white"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(16px, 2.5vw, 18px)'
                    }}
                  >
                    Enroll Now
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
