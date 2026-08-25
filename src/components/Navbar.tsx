import React from 'react';
import { VFXConfig } from '../types';
import { audioEngine } from '../utils/audioSynthesizer';
import { MTubeLogo } from './MTubeLogo';
import { 
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  config: VFXConfig;
  setConfig: React.Dispatch<React.SetStateAction<VFXConfig>>;
  onOpenControls: () => void;
  onOpenDiagnostics: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050608]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 3D Animated MTube Logo & Brand */}
        <div 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <MTubeLogo size="md" showSubtitle={true} />
        </div>

        {/* Navigation Links & Live System Status */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <a
            href="#downloads"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('downloads')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-slate-200 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>APP REPOSITORY</span>
          </a>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Sparkles size={12} className="text-cyan-400" />
            <span>LIVE SYNC: <strong className="text-cyan-300">ACTIVE</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <a
            href="#downloads"
            onClick={(e) => {
              e.preventDefault();
              audioEngine.triggerPulseChirp();
              document.getElementById('downloads')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-black font-semibold text-xs tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
          >
            <span>Downloads</span>
          </a>
        </div>
      </div>
    </header>
  );
};
