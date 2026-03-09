'use client';

import { Clock, Target, Code, Users } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  neon: string;
}

const StatsLoop = () => {
  const stats: StatItem[] = [
    { label: 'Total Duration', value: '14 Days', icon: Clock, color: 'from-purple-500 to-violet-600', neon: 'rgba(139, 92, 246, 0.3)' },
    { label: 'Learning Phases', value: '6 Stages', icon: Target, color: 'from-blue-500 to-cyan-600', neon: 'rgba(59, 130, 246, 0.3)' },
    { label: 'Active Projects', value: '1 Major', icon: Code, color: 'from-emerald-500 to-teal-600', neon: 'rgba(16, 185, 129, 0.3)' },
    { label: 'Students Enrolled', value: '15K+', icon: Users, color: 'from-orange-500 to-pink-600', neon: 'rgba(249, 115, 22, 0.3)' },
  ];

  const duplicatedStats = [...stats, ...stats, ...stats];

  return (
    <div className="relative w-full overflow-hidden mb-16">
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(250, 245, 255, 1), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(250, 245, 255, 1), transparent)' }}
      />

      {/* Scrolling container */}
      <div
        className="stats-loop-track flex items-center gap-6 py-4"
        style={{
          animation: 'statsLoop 30s linear infinite',
          width: 'max-content',
        }}
      >
        {duplicatedStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="relative group flex-shrink-0"
              style={{ width: '180px' }}
            >
              {/* 3D Shadow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-2xl transform translate-y-0 translate-x-0 group-hover:translate-y-1 group-hover:translate-x-1 transition-all duration-300 ease-out" />

              {/* Neon Glow Ring */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-50 transition-all duration-500 blur-lg"
                style={{ background: `linear-gradient(135deg, ${stat.neon}, ${stat.neon})` }}
              />

              {/* Card */}
              <div
                className="relative backdrop-blur-2xl rounded-2xl p-4 border border-white/60 bg-gradient-to-br from-white/80 to-white/60 hover:from-white/90 hover:to-white/80 transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 text-center"
                style={{ boxShadow: '0 4px 16px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-in-out rounded-2xl" />

                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ease-out`}
                  style={{ boxShadow: `0 4px 12px ${stat.neon}` }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div
                  className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: '20px',
                  }}
                >
                  {stat.value}
                </div>

                <div
                  className="text-gray-600"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '11px',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsLoop;
