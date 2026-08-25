import React, { useState, useEffect } from 'react';
import { AppItem } from '../services/appDataService';
import { authorizePremiumKey, AuthResult } from '../services/premiumAuthService';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  X, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCw, 
  MessageCircle,
  Download,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface PremiumUnlockModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (app: AppItem) => void;
}

export const PremiumUnlockModal: React.FC<PremiumUnlockModalProps> = ({
  app,
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authDetails, setAuthDetails] = useState<AuthResult['licenseInfo'] | null>(null);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  // 3D Card tilt state
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0 });

  // Reset state on modal open/app change
  useEffect(() => {
    if (isOpen) {
      setInputKey('');
      setErrorMsg('');
      setIsVerifying(false);
      setIsAuthorized(false);
      setAuthDetails(null);
      setDownloadTriggered(false);
    }
  }, [isOpen, app?.id]);

  if (!isOpen || !app) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotX: -y * 5,
      rotY: x * 5,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0 });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || isAuthorized) return;

    setErrorMsg('');

    if (!inputKey.trim()) {
      setErrorMsg('Please enter a valid VIP activation key.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Checks Gist key match
      // 2. Evaluates device binding against live Gist LicenseLimit
      // 3. Runs atomic Firestore transaction with device binding, fileName association & admin block/expiry checks
      const result = await authorizePremiumKey(inputKey, app._keyHash, app.licenseLimit, app.name);

      if (result.success) {
        setIsAuthorized(true);
        setAuthDetails(result.licenseInfo);
        audioEngine.triggerPulseChirp();
        onUnlocked(app);
      } else {
        setErrorMsg(result.error || 'Invalid premium key.');
        audioEngine.triggerSparkSound();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authorization error occurred.');
      audioEngine.triggerSparkSound();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadNow = () => {
    audioEngine.triggerPulseChirp();
    setDownloadTriggered(true);
    window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGetKeyWhatsApp = () => {
    audioEngine.triggerPulseChirp();
    const msg = encodeURIComponent(`Hello, I want to get the Premium Key for "${app.name}".`);
    window.open(`https://wa.me/923035945138?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        style={{ perspective: '1200px' }}
        className="w-full max-w-xl"
      >
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.rotX.toFixed(2)}deg) rotateY(${tilt.rotY.toFixed(2)}deg) translateZ(10px)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
          }}
          className="relative w-full bg-[#090c14] border border-amber-500/35 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col backdrop-blur-3xl card-premium-glow"
        >
          {/* Top Specular Neon Golden Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90 animate-pulse" />

          {/* Ambient Background Lights */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative p-6 sm:p-7 bg-gradient-to-r from-[#1a140b]/90 via-[#0d101a]/95 to-[#080a12] border-b border-white/10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl border shadow-lg transition-all duration-300 ${
                isAuthorized
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              }`}>
                {isAuthorized ? (
                  <Unlock size={24} className="text-emerald-400 animate-bounce" />
                ) : (
                  <Lock size={24} className="text-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isAuthorized
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}>
                    {isAuthorized ? 'VIP ACCESS AUTHORIZED' : 'VIP ENCRYPTED PACKAGE'}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-bold">
                    {app.fileType.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-1.5 premium-title-shimmer line-clamp-1">
                  {app.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 shrink-0 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-7 space-y-6 relative z-10">

            {!isAuthorized ? (
              /* ======================================================== */
              /* STATE 1: VIP AUTHORIZATION REQUIRED (KEY ENTRY)          */
              /* ======================================================== */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-xs sm:text-sm text-slate-300 font-tech leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/5 shadow-inner">
                  This file is locked under VIP authorization. Enter your verified VIP Key to bind your device and immediately unlock the protected high-speed downlink stream.
                </div>

                {/* Quick File Specs Bar (No Download Link Exposed) */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/50 rounded-2xl border border-white/10 text-xs font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">FILE SIZE</div>
                    <div className="font-bold text-white mt-0.5">{app.fileSize}</div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="text-[10px] text-slate-400">STATUS</div>
                    <div className="font-bold text-amber-400 mt-0.5">VIP LOCKED</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">INTEGRITY</div>
                    <div className="font-bold text-emerald-400 mt-0.5">SHA-256</div>
                  </div>
                </div>

                {/* Key Verification Form */}
                <form onSubmit={handleVerify} className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5 font-semibold">
                        <KeyRound size={14} className="text-amber-400" />
                        Enter VIP Authorization Key
                      </label>
                      <button
                        type="button"
                        onClick={handleGetKeyWhatsApp}
                        className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline transition-colors cursor-pointer"
                      >
                        <MessageCircle size={12} />
                        <span>Get Key via WhatsApp</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        disabled={isVerifying}
                        placeholder="Enter VIP Key (e.g. VIP_... or MTUBE_...)"
                        value={inputKey}
                        onChange={(e) => {
                          setInputKey(e.target.value);
                          setErrorMsg('');
                        }}
                        className="w-full bg-black/70 border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono placeholder:text-slate-500 tracking-wider outline-none transition-all disabled:opacity-50 shadow-inner"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-in fade-in">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-black font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 disabled:opacity-60 download-btn-3d cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <RotateCw size={15} className="animate-spin text-black" />
                          <span>VALIDATING VIP KEY...</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={15} />
                          <span>AUTHORIZE & UNLOCK VIP</span>
                          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleGetKeyWhatsApp}
                      className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] download-btn-3d cursor-pointer"
                    >
                      <MessageCircle size={14} className="text-emerald-400 animate-bounce" />
                      <span>Get VIP Key</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ======================================================== */
              /* STATE 2: AUTHORIZED PREMIUM ANIMATED DOWNLOAD CARD       */
              /* ======================================================== */
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                
                {/* Authorization Status Badge Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-black/80 to-[#0e171b] border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold font-display text-white flex items-center gap-2">
                        <span>VIP AUTHORIZATION CONFIRMED</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400/90 mt-0.5">
                        Device Bound • Secure Downlink Ready
                      </div>
                    </div>
                  </div>

                  {authDetails && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 font-semibold">
                        Slot {authDetails.boundCount}/{authDetails.licenseLimit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-black/50 border border-white/10 p-3 rounded-2xl space-y-0.5 text-center">
                    <div className="text-[10px] text-slate-400 font-mono">FILE SIZE</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-amber-400">{app.fileSize}</div>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-3 rounded-2xl space-y-0.5 text-center">
                    <div className="text-[10px] text-slate-400 font-mono">TYPE</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-cyan-400 uppercase">{app.fileType}</div>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-3 rounded-2xl space-y-0.5 text-center">
                    <div className="text-[10px] text-slate-400 font-mono">RELEASE</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-slate-200">{app.date}</div>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-3 rounded-2xl space-y-0.5 text-center">
                    <div className="text-[10px] text-slate-400 font-mono">SAFETY</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 flex items-center justify-center gap-1">
                      <ShieldCheck size={13} /> CLEAN
                    </div>
                  </div>
                </div>

                {/* Primary Animated 3D Download Button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleDownloadNow}
                    className="w-full py-4 px-6 rounded-2xl text-black font-extrabold text-sm sm:text-base font-display tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_35px_rgba(245,158,11,0.4)] vip-authorized-download-btn cursor-pointer"
                  >
                    <Download size={22} className="text-black animate-bounce shrink-0" />
                    <span>DOWNLOAD {app.name.toUpperCase()} ({app.fileSize})</span>
                    <Sparkles size={18} className="text-black animate-pulse shrink-0" />
                  </button>

                  {downloadTriggered ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Download initiated successfully! Click the button again if your browser blocked the download stream.</span>
                    </div>
                  ) : (
                    <p className="text-center text-[11px] font-mono text-slate-400">
                      Click the download button above to initiate the verified high-speed stream.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 sm:px-7 py-3.5 bg-black/60 border-t border-white/10 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>256-BIT ENCRYPTED DOWNLINK</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">MTUBE SECURE VIP GATEWAY</span>
          </div>

        </div>
      </div>
    </div>
  );
};
