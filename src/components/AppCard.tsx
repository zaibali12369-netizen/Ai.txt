import React, { useState } from 'react';
import { AppItem } from '../services/appDataService';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  Download, 
  Lock, 
  Calendar, 
  HardDrive, 
  Copy, 
  Check, 
  Info,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Zap
} from 'lucide-react';

interface AppCardProps {
  app: AppItem;
  onOpenDetails: (app: AppItem) => void;
  onOpenUnlockModal: (app: AppItem) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onOpenDetails,
  onOpenUnlockModal,
}) => {
  const [copied, setCopied] = useState(false);
  const isPremium = app.accessType === 'premium';

  // 3D Tilt calculation on mouse move
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Moderate tilt angles for sleek 3D perspective
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPremium) {
      onOpenUnlockModal(app);
    } else {
      audioEngine.triggerPulseChirp();
      window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleGetKeyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.triggerPulseChirp();
    const msg = encodeURIComponent(`Hello, I want to get the Premium Key for "${app.name}".`);
    window.open(`https://wa.me/923035945138?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(app.downloadUrl);
    setCopied(true);
    audioEngine.triggerPulseChirp();
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileTypeStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'apk') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (t === 'mp4' || t === 'video' || t === 'mkv') return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    if (t === 'pdf' || t === 'doc') return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (t === 'zip' || t === 'rar') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full"
    >
      <div 
        onClick={() => {
          if (isPremium) {
            onOpenUnlockModal(app);
          } else {
            onOpenDetails(app);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered 
            ? `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(12px) translateY(-6px)` 
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(0px)',
          transition: isHovered ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'transform 0.5s ease-out, box-shadow 0.5s ease',
          transformStyle: 'preserve-3d',
        }}
        className={`group relative rounded-2xl border flex flex-col justify-between overflow-hidden cursor-pointer backdrop-blur-xl transition-all duration-300 ${
          isPremium
            ? 'bg-gradient-to-b from-[#18130b]/95 via-[#0e111a]/95 to-[#070910] border-amber-500/35 hover:border-amber-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_20px_45px_rgba(245,158,11,0.22)] card-premium-glow'
            : 'bg-gradient-to-b from-[#0c1322]/95 via-[#080d19]/95 to-[#05070f] border-cyan-500/30 hover:border-cyan-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_20px_45px_rgba(6,182,212,0.22)] card-normal-glow'
        }`}
      >
        {/* Layered Top Glass Edge Highlight */}
        <div className={`h-[2px] w-full transition-all duration-300 ${
          isPremium 
            ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 group-hover:opacity-100 group-hover:via-amber-300'
            : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 group-hover:opacity-100 group-hover:via-cyan-300'
        }`} />

        {/* Ambient Corner Specular Reflection */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.06] to-transparent pointer-events-none rounded-tr-2xl" />

        {/* Card Header & Badges */}
        <div className="p-5 sm:p-6 space-y-4 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* File Type Badge */}
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${getFileTypeStyle(app.fileType)}`}>
                {app.fileType}
              </span>

              {/* Access Type Badge */}
              {isPremium ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Lock size={10} className="text-amber-400 animate-pulse" />
                  VIP ENCRYPTED
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  VERIFIED FREE
                </span>
              )}
            </div>

            {/* Quick info / copy action buttons */}
            <div className="flex items-center gap-1">
              {!isPremium && (
                <button
                  onClick={handleCopyLink}
                  title="Copy Direct Download Link"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors border border-white/5 shadow-inner"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPremium) {
                    onOpenUnlockModal(app);
                  } else {
                    onOpenDetails(app);
                  }
                }}
                title={isPremium ? "VIP Authorization Required" : "View Specifications & QR Code"}
                className={`p-1.5 rounded-lg transition-colors border shadow-inner ${
                  isPremium
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border-white/5'
                }`}
              >
                {isPremium ? <Lock size={13} /> : <Info size={13} />}
              </button>
            </div>
          </div>

          {/* Title & Description with 3D/Futuristic Shimmer for both Premium & Normal */}
          <div>
            <h3 className={`text-lg font-bold font-display line-clamp-1 transition-all duration-300 ${
              isPremium 
                ? 'premium-title-shimmer' 
                : 'normal-title-shimmer'
            }`}>
              {app.name}
            </h3>
            <p className="text-xs text-slate-400 font-tech mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
              {app.description}
            </p>
          </div>

          {/* Technical Specs Row */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <HardDrive size={12} className="text-cyan-400 shrink-0" />
              <span className="truncate">SIZE: <strong className="text-slate-200">{app.fileSize}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 justify-end">
              <Calendar size={12} className="text-orange-400 shrink-0" />
              <span className="truncate">RELEASE: <strong className="text-slate-200">{app.date}</strong></span>
            </div>
          </div>
        </div>

        {/* Card Action Buttons (Bottom) */}
        <div className="px-5 pb-5 pt-0 relative z-10 space-y-2" style={{ transform: 'translateZ(14px)' }}>
          {isPremium ? (
            <div className="flex items-center gap-2">
              {/* Primary Unlock Button */}
              <button
                onClick={handleDownloadClick}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-black shadow-amber-500/25 download-btn-3d cursor-pointer"
              >
                <Lock size={13} className="text-black" />
                <span className="truncate">UNLOCK VIP</span>
                <ArrowRight size={12} className="text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Dedicated "Get Key" Button via WhatsApp */}
              <button
                onClick={handleGetKeyClick}
                title="Get Premium Key via WhatsApp"
                className="py-2.5 px-3 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] download-btn-3d shrink-0 cursor-pointer"
              >
                <KeyRound size={13} className="text-emerald-400 animate-bounce" />
                <span>Get Key</span>
              </button>
            </div>
          ) : (
            /* Upgraded Premium-Grade 3D Normal Direct Download Button */
            <button
              onClick={handleDownloadClick}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:brightness-110 text-black shadow-cyan-500/25 download-btn-3d cursor-pointer"
            >
              <Download size={14} className="text-black" />
              <span>DIRECT DOWNLOAD</span>
              <ArrowRight size={13} className="text-black group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
