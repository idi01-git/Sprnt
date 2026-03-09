'use client';

import { useState, useEffect, useMemo } from 'react';

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

// Use deterministic values to avoid hydration mismatch
const generateParticles = (count: number): Array<{
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
}> => {
  // Use fixed seed values for consistency between server and client
  const seeds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(seeds[i % seeds.length] * 100).toFixed(1)}%`,
    top: `${(seeds[(i + 3) % seeds.length] * 100).toFixed(1)}%`,
    size: (seeds[(i + 5) % seeds.length] * 4 + 2),
    duration: (seeds[(i + 7) % seeds.length] * 10 + 10),
    delay: (seeds[(i + 9) % seeds.length] * 5)
  }));
};

export function FloatingParticles({ 
  count = 20,
  color = '#a855f7',
  className = '' 
}: FloatingParticlesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use memoized deterministic particles that are consistent between server and client
  const particles = useMemo(() => generateParticles(count), [count]);

  // Show placeholder on server and during hydration, then show particles after mount
  if (!mounted) {
    return <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} />;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`
          }}
        />
      ))}
    </div>
  );
}
