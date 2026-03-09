'use client';

import React, { useState } from 'react';
import { Engineering, RocketLaunch, Psychology, WorkspacePremium } from '@mui/icons-material';

const ProblemSolution = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: Engineering,
      label: 'FEATURE',
      title: 'Core Engineering Focus',
      description: 'Deep dive into specialized modules including Mechanical, Civil, Electrical, and Chemical Engineering with industry-standard tools.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      shadow: 'shadow-blue-500/30',
      neonColor: 'rgba(59, 130, 246, 0.5)',
      neonRing: 'rgba(59, 130, 246, 0.3)'
    },
    {
      icon: RocketLaunch,
      label: 'FEATURE',
      title: 'Real Startup Internships',
      description: 'Gain hands-on experience by solving actual problems for high-growth startups and established companies.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      shadow: 'shadow-purple-500/30',
      neonColor: 'rgba(168, 85, 247, 0.5)',
      neonRing: 'rgba(168, 85, 247, 0.3)'
    },
    {
      icon: Psychology,
      label: 'FEATURE',
      title: 'Expert Mentorship',
      description: '1-on-1 sessions with industry leaders from Fortune 500 companies and successful startup founders.',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      shadow: 'shadow-orange-500/30',
      neonColor: 'rgba(249, 115, 22, 0.5)',
      neonRing: 'rgba(249, 115, 22, 0.3)'
    },
    {
      icon: WorkspacePremium,
      label: 'FEATURE',
      title: 'Global Certification',
      description: 'Receive industry-recognized credentials verified by faculty and accepted globally upon successful completion.',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      shadow: 'shadow-emerald-500/30',
      neonColor: 'rgba(16, 185, 129, 0.5)',
      neonRing: 'rgba(16, 185, 129, 0.3)'
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden">
      {/* Floating Gradient Orbs */}
      <div className="absolute top-1/4 left-10 w-80 h-80 bg-gradient-to-br from-purple-300 to-blue-300 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-gradient-to-br from-cyan-300 to-indigo-300 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-3xl opacity-10 animate-pulse animation-delay-2000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2
            className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4"
            style={{ 
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 6vw, 48px)',
              lineHeight: '1.1'
            }}
          >
            The Sprintern Advantage
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
            Experience a premium, enterprise-grade learning environment focused on accelerating your engineering career
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === index;
            
            return (
              <div 
                key={index}
                className="relative transition-all duration-500"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  filter: hoveredCard !== null && hoveredCard !== index ? 'blur(2px) brightness(0.92)' : 'blur(0px) brightness(1)',
                  opacity: hoveredCard !== null && hoveredCard !== index ? 0.75 : 1
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Enhanced 3D Shadow - moves on hover */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl opacity-50 transition-all duration-500 ease-out`}
                  style={{
                    transform: isHovered 
                      ? 'translate(8px, 8px)' 
                      : 'translate(4px, 4px)'
                  }}
                />
                
                {/* Multi-layer Neon Glow - appears on hover */}
                <div 
                  className="absolute -inset-4 rounded-3xl transition-all duration-700 ease-out"
                  style={{ 
                    background: `radial-gradient(circle at center, ${feature.neonColor}, transparent 70%)`,
                    opacity: isHovered ? 1 : 0,
                    filter: 'blur(24px)'
                  }}
                />
                <div 
                  className="absolute -inset-2 rounded-3xl transition-all duration-500 ease-out"
                  style={{ 
                    background: `radial-gradient(circle at center, ${feature.neonRing}, transparent 70%)`,
                    opacity: isHovered ? 1 : 0,
                    filter: 'blur(16px)'
                  }}
                />
                
                {/* Enhanced Glassmorphic Card */}
                <div 
                  className="relative backdrop-blur-2xl rounded-3xl p-8 border transition-all duration-500 ease-out cursor-pointer"
                  style={{ 
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                    background: isHovered 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                    boxShadow: isHovered
                      ? `0 25px 60px ${feature.neonRing}, inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 0 40px rgba(255, 255, 255, 0.5)`
                      : '0 8px 32px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                    transform: isHovered 
                      ? 'translate(-4px, -4px)' 
                      : 'translate(0, 0)'
                  }}
                >
                  {/* Enhanced Shine Effect - simple left to right sweep */}
                  <div 
                    className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-700 ease-out overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 ease-out"
                      style={{
                        transform: isHovered 
                          ? 'translateX(100%)' 
                          : 'translateX(-100%)',
                        width: '200%'
                      }}
                    />
                  </div>
                  
                  {/* Feature Label with subtle glow */}
                  <span
                    className="inline-block px-3 py-1 rounded-full backdrop-blur-lg bg-white/70 border text-gray-600 mb-4 transition-all duration-300 relative"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      borderColor: isHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                      boxShadow: isHovered 
                        ? `0 4px 20px ${feature.neonRing}, inset 0 1px 0 rgba(255, 255, 255, 0.9)` 
                        : '0 4px 12px rgba(0, 0, 0, 0.05)',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {feature.label}
                  </span>

                  {/* Icon and Title Container */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Enhanced 3D Icon with smooth animation */}
                    <div 
                      className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} relative overflow-hidden transition-all duration-500 ease-out`}
                      style={{ 
                        boxShadow: isHovered 
                          ? `0 20px 48px ${feature.neonColor}, inset 0 -6px 12px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.4)`
                          : `0 8px 24px ${feature.neonRing}, inset 0 -4px 8px rgba(0, 0, 0, 0.1)`,
                        transform: isHovered 
                          ? 'scale(1.2) rotate(10deg) translateY(-4px)' 
                          : 'scale(1) rotate(0deg) translateY(0)',
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {/* Icon shine effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent transition-opacity duration-500"
                        style={{ opacity: isHovered ? 1 : 0.3 }}
                      />
                      
                      <Icon 
                        sx={{ 
                          fontSize: 32, 
                          color: 'white',
                          transition: 'all 0.5s ease-out',
                          transform: isHovered ? 'scale(1.15) rotate(-10deg)' : 'scale(1) rotate(0deg)',
                          position: 'relative',
                          zIndex: 10
                        }} 
                      />
                      
                      {/* Multi-layer inner glow */}
                      <div className="absolute inset-2 rounded-xl bg-white/20" />
                      <div className="absolute inset-3 rounded-lg bg-white/10" />
                    </div>
                    
                    {/* Title with smooth gradient transition */}
                    <h3
                      className="text-gray-900 pt-2 flex-1 transition-all duration-500"
                      style={{ 
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: 'clamp(20px, 3vw, 24px)',
                        lineHeight: '1.2'
                      }}
                    >
                      {feature.title}
                    </h3>
                  </div>

                  {/* Description with smooth color transition */}
                  <p
                    className="relative z-10 transition-all duration-300"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: isHovered ? '#1f2937' : '#4b5563'
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Animated Bottom Border with Neon pulse */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-3xl transition-all duration-500 ease-out overflow-hidden`}
                    style={{ 
                      transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      boxShadow: isHovered ? `0 0 24px ${feature.neonColor}, 0 0 48px ${feature.neonRing}` : 'none'
                    }}
                  >
                    {/* Animated shine on border */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 ease-out"
                      style={{
                        transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)'
                      }}
                    />
                  </div>
                  
                  {/* Decorative Corner Gradient with smooth pulse */}
                  <div 
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-bl-full transition-opacity duration-500`}
                    style={{ opacity: isHovered ? 0.12 : 0.05 }}
                  />

                  {/* Floating particles effect on hover */}
                  {isHovered && (
                    <>
                      <div 
                        className="absolute rounded-full bg-gradient-to-br opacity-0 animate-float"
                        style={{ 
                          top: '16px', 
                          right: '16px', 
                          width: '8px', 
                          height: '8px',
                          backgroundImage: `linear-gradient(to bottom right, ${feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('purple') ? '#a855f7' : feature.gradient.includes('orange') ? '#f97316' : '#10b981'}, ${feature.gradient.includes('cyan') ? '#06b6d4' : feature.gradient.includes('pink') ? '#ec4899' : feature.gradient.includes('red') ? '#ef4444' : '#14b8a6'})`,
                          animation: 'float 3s ease-in-out infinite',
                          opacity: 0.6
                        }}
                      />
                      <div 
                        className="absolute rounded-full bg-gradient-to-br animate-float"
                        style={{ 
                          top: '32px', 
                          right: '48px', 
                          width: '6px', 
                          height: '6px',
                          backgroundImage: `linear-gradient(to bottom right, ${feature.gradient.includes('blue') ? '#06b6d4' : feature.gradient.includes('purple') ? '#ec4899' : feature.gradient.includes('orange') ? '#f59e0b' : '#14b8a6'}, ${feature.gradient.includes('cyan') ? '#3b82f6' : feature.gradient.includes('pink') ? '#a855f7' : feature.gradient.includes('red') ? '#f97316' : '#10b981'})`,
                          animation: 'float 3s ease-in-out infinite 0.5s',
                          opacity: 0.5
                        }}
                      />
                      <div 
                        className="absolute rounded-full bg-gradient-to-br animate-float"
                        style={{ 
                          top: '48px', 
                          right: '32px', 
                          width: '4px', 
                          height: '4px',
                          backgroundImage: `linear-gradient(to bottom right, ${feature.gradient.includes('blue') ? '#8b5cf6' : feature.gradient.includes('purple') ? '#f472b6' : feature.gradient.includes('orange') ? '#fb923c' : '#5eead4'}, ${feature.gradient.includes('cyan') ? '#06b6d4' : feature.gradient.includes('pink') ? '#a855f7' : feature.gradient.includes('red') ? '#f97316' : '#14b8a6'})`,
                          animation: 'float 3s ease-in-out infinite 1s',
                          opacity: 0.4
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;