'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Sparkles, TrendingUp, Award, Users, ArrowRight } from 'lucide-react';
import { BackgroundEffect } from './BackgroundEffect';
import { FloatingParticles } from './FloatingParticles';

const heroMain = '/images/hero (1).svg';

const HeroSection = () => {
  const imgRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-24 pb-20">
      {/* Animated Background Elements */}
      <BackgroundEffect variant="gradient" />
      <FloatingParticles count={15} color="#a855f7" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in animation-delay-300 relative group"
            >
              {/* Enhanced Glassmorphic Badge */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-full border border-purple-300/50"
                style={{ boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)' }}
              />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)' }}
              />
              <Sparkles className="w-4 h-4 text-purple-600 relative z-10" />
              <span 
                className="text-purple-700 relative z-10"
                style={{ 
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Transform Your Career in 14 Days
              </span>
            </div>

            <h1
              className="mb-6 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 bg-clip-text text-transparent animate-fade-in animation-delay-400"
              style={{ 
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: '56px',
                lineHeight: '1.1'
              }}
            >
              Get Industrial Experience in{' '}
              <span className="relative inline-block">
                14 Days
                <div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-purple-400 to-blue-400 opacity-30 rounded animate-expand-width animation-delay-1000"
                />
              </span>
            </h1>

            <p
              className="text-gray-600 mb-8 animate-fade-in animation-delay-500"
              style={{ 
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '1.7'
              }}
            >
              Tool-specific virtual internships for Core Engineers.{' '}
              <span className="font-semibold text-purple-700"> Verified by Faculty.</span>
              <span className="font-semibold text-blue-700"> Accepted by Industry.</span>
            </p>

            <div
              className="flex flex-wrap gap-4 mb-10 animate-fade-in animation-delay-600"
            >
              <button
                className="relative px-8 py-4 rounded-xl overflow-hidden group shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                style={{ 
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500 to-blue-500" />
                <span className="relative text-white z-10 flex items-center gap-2">
                  Explore Internships
                  <TrendingUp className="w-5 h-5" />
                </span>
              </button>

              <button
                className="px-8 py-4 rounded-xl border-2 border-purple-200 bg-white hover:bg-purple-50 transition-all shadow-sm hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                style={{ 
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  color: '#7C3AED'
                }}
              >
                View Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div
              className="grid grid-cols-3 gap-6 animate-fade-in animation-delay-800"
            >
              {[
                { icon: Users, value: '10K+', label: 'Students' },
                { icon: Award, value: '98%', label: 'Success Rate' },
                { icon: Sparkles, value: '4.9/5', label: 'Rating' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div 
                    className="text-purple-900 mb-1"
                    style={{ 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: '20px'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className="text-gray-600"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: '13px'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - 3D Card Grid */}
          <div className="relative animate-fade-in-right animation-delay-400">
            <div className="flex justify-center">
              {[
                { img: heroMain, delay: 500 }
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative group animate-fade-in-up w-full max-w-3xl"
                  style={{ 
                    perspective: '1200px',
                    animationDelay: `${item.delay}ms`
                  }}
                  onMouseMove={(e) => {
                    const el = imgRef.current;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    const rotateY = x * 14;
                    const rotateX = -y * 10;
                    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
                  }}
                  onMouseLeave={() => {
                    const el = imgRef.current;
                    if (!el) return;
                    el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
                  }}
                >
                  <div
                    ref={imgRef}
                    className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 transition-transform duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <Image
                      src={item.img}
                      alt="Engineering Software"
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Elements */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/50 flex items-center justify-center animate-float"
              style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)' }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;