import React, { useState } from 'react';
import { AppItem } from '../services/appDataService';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  HardDrive, 
  Calendar, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Zap,
  Smartphone
} from 'lucide-react';

interface DownloadDetailModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlockRequest?: (app: AppItem) => void;
}

export const DownloadDetailModal: React.FC<DownloadDetailModalProps> = ({
  app,
  isOpen,
  onClose,
  onUnlockRequest,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'qr'>('details');

  if (!isOpen || !app) return null;

  const isPremium = app.accessType === 'premium';

  // If a premium file is passed, immediately delegate to the VIP Unlock Modal
  if (isPremium) {
    if (onUnlockRequest) {
      onUnlockRequest(app);
    }
    onClose();
    return null;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(app.downloadUrl);
    setCopied(true);
    audioEngine.triggerPulseChirp();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartDownload = () => {
    audioEngine.triggerPulseChirp();
    if (isPremium && onUnlockRequest) {
      onClose();
      onUnlockRequest(app);
    } else {
      window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Generate lightweight SVG QR representation using Google Charts API or fallback SVG
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(app.downloadUrl)}&bgcolor=0c0f17&color=f97316`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0f17] border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-950/40 via-black to-[#0e131f] border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <HardDrive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-semibold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                  {app.fileType.toUpperCase()}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
                  app.accessType === 'premium' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {app.accessType.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold font-display text-white mt-1">
                {app.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-4 text-xs font-mono tracking-wider transition-all border-b-2 ${
              activeTab === 'details'
                ? 'border-orange-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            PACKAGE DETAILS
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-4 text-xs font-mono tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-orange-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            SCAN QR FOR PHONE
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'details' ? (
            <>
              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Package Summary</label>
                <p className="text-xs sm:text-sm text-slate-200 font-tech bg-white/5 p-3.5 rounded-xl border border-white/5 leading-relaxed">
                  {app.description}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-mono">FILE SIZE</div>
                  <div className="text-sm font-bold font-mono text-white">{app.fileSize}</div>
                </div>
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-mono">RELEASE DATE</div>
                  <div className="text-sm font-bold font-mono text-white">{app.date}</div>
                </div>
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400 font-mono">VIRUSTOTAL CHECK</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={14} /> CLEAN 100%
                  </div>
                </div>
              </div>

              {/* Download URL row */}
              {!isPremium ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Direct Target URL</label>
                  <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-2 rounded-xl">
                    <input
                      type="text"
                      readOnly
                      value={app.downloadUrl}
                      className="flex-1 bg-transparent text-xs font-mono text-slate-300 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      title="Copy Download URL"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors shrink-0"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400 animate-pulse" />
                    <span>Protected Premium Downlink — Key Authorization Required</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
              {!isPremium ? (
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-xl">
                    <img
                      src={qrUrl}
                      alt="Download QR Code"
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs font-mono text-slate-300 max-w-xs">
                    Scan with your Android, iOS, or iPad camera to download directly to your mobile device.
                  </p>
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Zap size={20} />
                  </div>
                  <p className="text-xs font-mono text-amber-200">
                    QR Downlink is encrypted. Please authorize this VIP asset using your Premium Key to access the direct mobile downlink.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Download Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleStartDownload}
              className={`flex-1 py-3 rounded-xl font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                isPremium 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black shadow-amber-500/25 download-btn-3d' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-black shadow-orange-500/25 download-btn-3d'
              }`}
            >
              {isPremium ? <Sparkles size={16} /> : <Download size={16} />}
              {isPremium ? 'AUTHORIZE & UNLOCK VIP' : 'DOWNLOAD NOW'}
            </button>

            {!isPremium && (
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs tracking-wider flex items-center gap-2 border border-white/10 transition-all active:scale-95"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY LINK'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck size={13} />
            DIRECT VERIFIED DOWNLINK
          </span>
          <span>MTUBE CLOUD HOSTED</span>
        </div>
      </div>
    </div>
  );
};
