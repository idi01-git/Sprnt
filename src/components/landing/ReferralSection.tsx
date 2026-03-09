'use client';

import React, { useState } from 'react';
import { Wallet, Users, Gift, Star, TrendingUp } from 'lucide-react';

const ReferralSection = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      icon: Users,
      title: 'Share Your Link',
      description: 'Get a unique referral code after signup. Share it with friends via WhatsApp, email, or social media.',
      gradient: 'from-blue-400 to-blue-600',
      delay: 500,
      neonColor: 'rgba(59, 130, 246, 0.6)',
      neonRing: 'rgba(59, 130, 246, 0.3)'
    },
    {
      icon: Wallet,
      title: 'Earn ₹50/Purchase ',
      description: 'Credits automatically added when your friend enrolls. Track your earnings in real-time dashboard.',
      gradient: 'from-green-400 to-green-600',
      delay: 600,
      neonColor: 'rgba(34, 197, 94, 0.6)',
      neonRing: 'rgba(34, 197, 94, 0.3)'
    },
    {
      icon: Gift,
      title: 'Unlock Pocket Money',
      description: 'Use accumulated credits to enroll in any track. No hidden charges or expiry dates.',
      gradient: 'from-yellow-400 to-orange-500',
      delay: 700,
      neonColor: 'rgba(251, 146, 60, 0.6)',
      neonRing: 'rgba(251, 146, 60, 0.3)'
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-46 h-46 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          {/* Floating Stars */}
          <div className="relative inline-block mb-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float-rotate"
                style={{
                  left: `${i * 40 - 40}px`,
                  top: -20,
                  animationDelay: `${i * 300}ms`
                }}
              >
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
            ))}

            <span
              className="inline-block px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 text-white"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '16px'
              }}
            >
              🎁 Limited Time Offer
            </span>
          </div>

          <h2
            className="text-white mb-6 animate-fade-in animation-delay-200"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 8vw, 56px)',
              lineHeight: '1.1'
            }}
          >
            Learn for Free?
            <br />
            <span className="text-yellow-300">Yes, It's Possible!</span>
          </h2>

          <p
            className="text-white/90 mb-4 animate-fade-in animation-delay-300"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(16px, 3vw, 20px)'
            }}
          >
            Refer friends and earn credits.
          </p>

          <div
            className="inline-block px-8 py-4 rounded-2xl bg-yellow-400 text-purple-900 mb-12 animate-scale-in animation-delay-400"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(20px, 4vw, 28px)'
            }}
          >
            1 Course = ₹50 🎉
          </div>
        </div>

        {/* Steps Grid with Enhanced Hover */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isHovered = hoveredStep === index;

            return (
              <div
                key={index}
                className="relative animate-fade-in-up transition-all duration-500"
                style={{
                  animationDelay: `${step.delay}ms`,
                  filter: hoveredStep !== null && hoveredStep !== index ? 'blur(2px) brightness(0.85)' : 'blur(0px) brightness(1)',
                  opacity: hoveredStep !== null && hoveredStep !== index ? 0.7 : 1
                }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Enhanced 3D Shadow - moves smoothly */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-3xl opacity-30 transition-all duration-500 ease-out`}
                  style={{
                    transform: isHovered
                      ? 'translate(8px, 8px)'
                      : 'translate(4px, 4px)'
                  }}
                />

                {/* Multi-layer Neon Glow - activates on hover */}
                <div
                  className="absolute -inset-4 rounded-3xl transition-all duration-700 ease-out"
                  style={{
                    background: `radial-gradient(circle at center, ${step.neonColor}, transparent 70%)`,
                    opacity: isHovered ? 1 : 0,
                    filter: 'blur(24px)'
                  }}
                />
                <div
                  className="absolute -inset-2 rounded-3xl transition-all duration-500 ease-out"
                  style={{
                    background: `radial-gradient(circle at center, ${step.neonRing}, transparent 70%)`,
                    opacity: isHovered ? 1 : 0,
                    filter: 'blur(16px)'
                  }}
                />

                {/* Enhanced Glassmorphic Card */}
                <div
                  className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                    background: isHovered
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isHovered
                      ? `0 25px 60px ${step.neonRing}, inset 0 0 40px rgba(255, 255, 255, 0.15)`
                      : '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)',
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
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out"
                      style={{
                        transform: isHovered
                          ? 'translateX(100%)'
                          : 'translateX(-100%)',
                        width: '200%'
                      }}
                    />
                  </div>

                  {/* Enhanced 3D Icon with smooth animation */}
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-2xl relative z-10 overflow-hidden transition-all duration-500 ease-out`}
                    style={{
                      boxShadow: isHovered
                        ? `0 20px 48px ${step.neonColor}, inset 0 -6px 12px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.3)`
                        : `0 12px 32px ${step.neonRing}, inset 0 -4px 8px rgba(0, 0, 0, 0.2)`,
                      transform: isHovered
                        ? 'scale(1.15) rotate(8deg) translateY(-4px)'
                        : 'scale(1) rotate(0deg) translateY(0)'
                    }}
                  >
                    {/* Icon shine overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent transition-opacity duration-500"
                      style={{ opacity: isHovered ? 1 : 0.3 }}
                    />

                    <Icon
                      className="w-10 h-10 text-white relative z-10 transition-all duration-500 ease-out"
                      strokeWidth={2.5}
                      style={{
                        transform: isHovered ? 'scale(1.1) rotate(-8deg)' : 'scale(1) rotate(0deg)'
                      }}
                    />

                    {/* Multi-layer inner glow */}
                    <div className="absolute inset-2 rounded-xl bg-white/20" />
                    <div className="absolute inset-3 rounded-lg bg-white/10" />
                  </div>

                  {/* Step Number with glow */}
                  <div
                    className="absolute top-2 right-0 text-white relative z-10 transition-all duration-500"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 900,
                      fontSize: '48px',
                      opacity: isHovered ? 0.4 : 0.3,
                      textShadow: isHovered ? `0 0 30px ${step.neonRing}` : 'none',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Title with smooth transition */}
                  <h3
                    className="text-white mb-4 relative z-10 transition-all duration-300"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(20px, 3vw, 24px)',
                      textShadow: isHovered ? '0 2px 20px rgba(0, 0, 0, 0.3)' : 'none'
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description with color transition */}
                  <p
                    className="relative z-10 transition-all duration-300"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: '15px',
                      lineHeight: '1.6',
                      color: isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {step.description}
                  </p>

                  {/* Animated progress line at bottom */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} rounded-b-3xl transition-all duration-500 ease-out overflow-hidden`}
                    style={{
                      transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      boxShadow: isHovered ? `0 0 24px ${step.neonColor}` : 'none'
                    }}
                  >
                    {/* Shine on progress line */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 ease-out"
                      style={{
                        transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)'
                      }}
                    />
                  </div>

                  {/* Floating particles on hover */}
                  {isHovered && (
                    <>
                      <div
                        className="absolute rounded-full opacity-0 animate-float"
                        style={{
                          top: '20px',
                          right: '20px',
                          width: '6px',
                          height: '6px',
                          backgroundImage: `linear-gradient(to bottom right, ${step.gradient.includes('blue') ? '#60a5fa' : step.gradient.includes('green') ? '#4ade80' : '#fbbf24'}, ${step.gradient.includes('blue') ? '#3b82f6' : step.gradient.includes('green') ? '#22c55e' : '#f97316'})`,
                          animation: 'float 3s ease-in-out infinite',
                          opacity: 0.7
                        }}
                      />
                      <div
                        className="absolute rounded-full animate-float"
                        style={{
                          top: '36px',
                          right: '52px',
                          width: '4px',
                          height: '4px',
                          backgroundImage: `linear-gradient(to bottom right, ${step.gradient.includes('blue') ? '#93c5fd' : step.gradient.includes('green') ? '#86efac' : '#fcd34d'}, ${step.gradient.includes('blue') ? '#60a5fa' : step.gradient.includes('green') ? '#4ade80' : '#fbbf24'})`,
                          animation: 'float 3s ease-in-out infinite 0.7s',
                          opacity: 0.6
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced CTA Button */}
        <div className="text-center animate-fade-in animation-delay-800">
          <button
            className="group relative px-12 py-5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 inline-block"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: '18px'
            }}
          >
            {/* 3D Shadow layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl transform translate-y-2 group-hover:translate-y-3 transition-all duration-300 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl transform translate-y-1 opacity-70" />

            {/* Neon glow on hover */}
            <div className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
              style={{ background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.6), transparent 70%)' }}
            />

            {/* Button gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-yellow-300 to-orange-400" />

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-2xl" />

            <span className="relative text-purple-900 z-10 flex items-center justify-center gap-3">
              Get Your Referral Link
              <TrendingUp className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </span>
          </button>

          <p
            className="text-white/70 mt-4 animate-fade-in animation-delay-1000"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: '14px'
            }}
          >
            Join 2,500+ students already earning credits
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReferralSection;
