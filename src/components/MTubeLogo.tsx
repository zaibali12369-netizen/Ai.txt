import React, { useState } from 'react';

interface MTubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const MTubeLogo: React.FC<MTubeLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Letter breakdown for staggered 3D wave animation
  const letters = [
    { char: 'M', delay: '0ms', color: 'from-orange-400 via-amber-300 to-orange-500' },
    { char: 'T', delay: '120ms', color: 'from-orange-300 via-amber-200 to-amber-400' },
    { char: 'u', delay: '240ms', color: 'from-amber-300 via-orange-300 to-amber-400' },
    { char: 'b', delay: '360ms', color: 'from-amber-400 via-orange-400 to-orange-500' },
    { char: 'e', delay: '480ms', color: 'from-orange-400 via-cyan-300 to-cyan-400' },
  ];

  const textSizeClass = 
    size === 'sm' ? 'text-lg sm:text-xl' :
    size === 'lg' ? 'text-3xl sm:text-4xl' :
    'text-xl sm:text-2xl';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-3 select-none cursor-pointer ${className}`}
      style={{ perspective: '800px' }}
    >
      {/* 3D Isometric Holographic Cube / Play Symbol Icon */}
      <div 
        className="relative flex items-center justify-center transition-transform duration-700 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered ? 'rotateY(25deg) rotateX(15deg) scale(1.08)' : 'rotateY(0deg) rotateX(0deg) scale(1)',
        }}
      >
        {/* Animated Cyber Aura Ring */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 opacity-60 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-700 animate-pulse" />
        
        {/* Outer 3D Beveled Box */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-cyan-500 p-[1.5px] shadow-[0_8px_25px_rgba(249,115,22,0.35)]">
          <div className="w-full h-full bg-[#080b12] rounded-[10px] flex items-center justify-center relative overflow-hidden">
            
            {/* Specular Glint & Scanline */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-40 group-hover:opacity-80 transition-opacity" />
            
            {/* 3D Futuristic Triangular Tube/Play Prism */}
            <div 
              className="relative z-10 flex items-center justify-center transform transition-transform duration-500"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.8)) drop-shadow(0 0 14px rgba(6, 182, 212, 0.5))',
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white transform group-hover:scale-110 transition-transform duration-500"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M6 4.5L19 12L6 19.5V4.5Z" 
                  fill="url(#mtube_gradient)" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="1.2" 
                  strokeLinejoin="round" 
                />
                <defs>
                  <linearGradient id="mtube_gradient" x1="6" y1="4.5" x2="19" y2="19.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F97316" />
                    <stop offset="0.5" stopColor="#FBBF24" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Micro Corner Accent LEDs */}
            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
            <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_6px_#f97316]" />
          </div>
        </div>
      </div>

      {/* 3D Animated MTube Wordmark */}
      <div 
        className="flex flex-col justify-center"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="flex items-center tracking-wider font-display font-black leading-none mtube-wordmark-container">
          {letters.map((item, index) => (
            <span
              key={index}
              className={`inline-block font-black font-display tracking-tight transition-all duration-500 mtube-3d-letter ${textSizeClass}`}
              style={{
                animationDelay: item.delay,
                transformStyle: 'preserve-3d',
              }}
            >
              <span 
                className={`bg-gradient-to-b ${item.color} bg-clip-text text-transparent`}
                style={{
                  textShadow: '0 2px 12px rgba(249, 115, 22, 0.4), 0 0 25px rgba(251, 191, 36, 0.25)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                }}
              >
                {item.char}
              </span>
            </span>
          ))}

          {/* Futuristic 3D Cyber Badge Suffix */}
          <span 
            className="ml-1.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-orange-500/40 text-[9px] font-mono text-cyan-300 font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.3)] hidden sm:inline-block"
            style={{
              textShadow: '0 0 8px rgba(6,182,212,0.6)',
            }}
          >
            3D
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] font-mono tracking-[0.22em] text-slate-400 uppercase font-medium">
              // CLOUD DOWNLINK
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
