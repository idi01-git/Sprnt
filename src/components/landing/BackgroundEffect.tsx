'use client';

interface BackgroundEffectProps {
  variant?: 'gradient' | 'dots' | 'grid' | 'waves';
  className?: string;
}

export function BackgroundEffect({ 
  variant = 'gradient',
  className = '' 
}: BackgroundEffectProps) {
  if (variant === 'dots') {
    return (
      <div className={`absolute inset-0 opacity-30 pointer-events-none ${className}`}>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(168, 85, 247) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`absolute inset-0 opacity-20 pointer-events-none ${className}`}>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} 
        />
      </div>
    );
  }

  if (variant === 'waves') {
    return (
      <div className={`absolute inset-0 opacity-20 pointer-events-none overflow-hidden ${className}`}>
        <svg
          className="absolute w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#wave-gradient)"
            fillOpacity="0.3"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Default gradient variant
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob-reverse" />
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-breathe" />
    </div>
  );
}
