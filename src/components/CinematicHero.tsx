import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VFXConfig } from '../types';
import { CyberCanvasRenderer } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Camera, 
  Activity, 
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Layers
} from 'lucide-react';

interface CinematicHeroProps {
  config: VFXConfig;
  setConfig: React.Dispatch<React.SetStateAction<VFXConfig>>;
  onOpenControls: () => void;
  onOpenDiagnostics: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  config,
  setConfig,
  onOpenControls,
  onOpenDiagnostics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<CyberCanvasRenderer | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resolution & retina
    const updateDimensions = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      if (rendererRef.current) {
        rendererRef.current.updateConfig(config);
      }
    };

    updateDimensions();
    const renderer = new CyberCanvasRenderer(canvas, config);
    rendererRef.current = renderer;
    renderer.start();

    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      renderer.stop();
    };
  }, []);

  // Update renderer config when props change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateConfig(config);
    }
  }, [config]);

  // Handle Parallax and Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;
    setMouseOffset({ x: normX, y: normY });

    if (rendererRef.current && canvasRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rendererRef.current.setMousePosition(x * dpr, y * dpr, true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
    if (rendererRef.current) {
      rendererRef.current.setMousePosition(0, 0, false);
    }
  }, []);

  // Toggle Audio
  const handleToggleAudio = () => {
    if (config.audioEnabled) {
      audioEngine.stop();
      setConfig((prev) => ({ ...prev, audioEnabled: false }));
    } else {
      audioEngine.start(config.audioVolume);
      setConfig((prev) => ({ ...prev, audioEnabled: true }));
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 4K Snapshot Tool
  const handleTakeSnapshot = () => {
    if (!canvasRef.current || !containerRef.current) return;
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 1920;
      snapCanvas.height = 1080;
      const snapCtx = snapCanvas.getContext('2d');
      if (!snapCtx) return;

      // Draw background / video
      if (videoRef.current && !videoError) {
        snapCtx.drawImage(videoRef.current, 0, 0, 1920, 1080);
      } else {
        // Draw dark gradient backdrop
        const grad = snapCtx.createRadialGradient(960, 540, 50, 960, 540, 1000);
        grad.addColorStop(0, '#101726');
        grad.addColorStop(1, '#030508');
        snapCtx.fillStyle = grad;
        snapCtx.fillRect(0, 0, 1920, 1080);
      }

      // Draw canvas VFX layer
      snapCtx.drawImage(canvasRef.current, 0, 0, 1920, 1080);

      const link = document.createElement('a');
      link.download = `mtube-cyber-cinematic-${Date.now()}.png`;
      link.href = snapCanvas.toDataURL('image/png', 1.0);
      link.click();
      audioEngine.triggerPulseChirp();
    } catch (err) {
      console.error('Snapshot failed', err);
    }
  };

  // Video recording capture
  const handleToggleRecord = () => {
    if (recordingStatus === 'recording') {
      mediaRecorderRef.current?.stop();
      setRecordingStatus('finished');
      return;
    }

    if (!canvasRef.current) return;

    try {
      const stream = canvasRef.current.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mtube-hero-vfx-${Date.now()}.webm`;
        a.click();
        setRecordingStatus('idle');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingStatus('recording');
      audioEngine.triggerPulseChirp();
    } catch {
      alert('Video capture is ready. Use Snapshot button for high-res stills.');
    }
  };

  // Camera push-in calculation
  const parallaxX = mouseOffset.x * 12 * config.parallaxStrength;
  const parallaxY = mouseOffset.y * 12 * config.parallaxStrength;

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden select-none transition-all duration-700 ${
        isFullscreen ? 'h-screen flex items-center justify-center bg-black' : 'w-full flex items-center justify-center pt-2 sm:pt-4 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8'
      }`}
    >
      {/* Outer 16:9 Cinematic Stage Frame */}
      <div 
        className={`relative w-full max-w-[1600px] aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.85)] transition-transform duration-500 bg-[#05070c] ${
          isFullscreen ? '!max-w-none !h-full !rounded-none !border-none' : ''
        }`}
      >
        {/* Subtle Cybernetic Background Grid */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none z-0"></div>

        {/* 1. Base Layer: Primary 16:9 Video / High Fidelity Image Stream */}
        <div 
          className="absolute inset-0 transition-transform duration-700 ease-out origin-center pointer-events-none z-0"
          style={{
            transform: `scale(${config.cameraPushIn ? 1.04 + Math.sin(Date.now() / 4000) * 0.02 : 1}) translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
          }}
        >
          {/* Cloudinary Embedded MP4 Stream / Player */}
          {config.videoSourceMode !== 'canvas-vfx' && (
            <video
              ref={videoRef}
              src="https://res.cloudinary.com/olbslti4/video/upload/Converting_robot_image_to_video_202608231655.mp4"
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => {
                setVideoError(true);
                setVideoLoaded(true);
              }}
              className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
                videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* High Fidelity Cybernetic Visual Backdrop Fallback/Underlay */}
          {(!videoLoaded || videoError || config.videoSourceMode === 'canvas-vfx') && (
            <div className="absolute inset-0 bg-[#060810] flex items-center justify-center">
              {/* High-res Cyborg Silhouette & Neural Lighting */}
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 45%, rgba(249, 115, 22, 0.12) 0%, rgba(10, 15, 26, 0.95) 75%), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop')`,
                  filter: 'contrast(1.15) brightness(0.95)',
                }}
              />
            </div>
          )}

          {/* Embedded Cloudinary Web Frame Fallback if Direct MP4 is blocked */}
          {videoError && config.videoSourceMode === 'stream' && (
            <iframe
              src="https://player.cloudinary.com/embed/?cloud_name=olbslti4&public_id=Converting_robot_image_to_video_202608231655&autoplay=true&loop=true&controls=false&muted=true"
              className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90 scale-105"
              allow="autoplay; fullscreen"
            />
          )}
        </div>

        {/* 2. Procedural Canvas VFX Layer (Electric Arcs, Sparks, Internal Glowing Conduits) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* 3. Cinematic Vignette & Deep Contrast Grade */}
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/90 via-transparent to-[#050608]/40 pointer-events-none z-20" />

        {/* 4. Telemetry HUD (Minimal & non-intrusive) */}
        {config.hudOverlay && !isCleanMode && (
          <div className="absolute inset-0 pointer-events-none z-20" />
        )}

        {/* 5. Hero Clean Content & Exploration UI */}
        {!isCleanMode && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 md:p-12 pointer-events-none">
            {/* Top Bar Header with Controls (Transparent overlay) */}
            <div className="flex items-center justify-between w-full">
              <div className="pointer-events-auto" />
            </div>

            {/* Main Hero Typography - DIRECT LEFT-ALIGNED OVERLAY (NO BOX/CARD) */}
            <div className="w-full max-w-xl text-left space-y-4 my-auto py-2 self-start pointer-events-auto">
              {/* Badge */}
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-orange-400 font-semibold px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 backdrop-blur-md inline-block shadow-sm">
                  FAST • SECURE • DIRECT
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-display text-white leading-[1.05] tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
                  Download <br />
                  Everything. <br />
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(249,115,22,0.4)]">
                    Fast & Easy.
                  </span>
                </h1>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#downloads"
                  onClick={(e) => {
                    e.preventDefault();
                    audioEngine.triggerPulseChirp();
                    document.getElementById('downloads')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:brightness-110 shadow-xl shadow-orange-500/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Layers size={17} className="group-hover:scale-110 transition-transform" />
                  <span>Explore Downloads</span>
                </a>
              </div>
            </div>

            {/* Bottom Info Ticker */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wider">DIRECT HIGH-SPEED GIGABIT DOWNLINK</span>
              </div>
              <span className="hidden sm:inline text-slate-400 tracking-wider">MTUBE CLOUD ENGINE</span>
            </div>
          </div>
        )}

        {/* Clean Mode Exit Pill */}
        {isCleanMode && (
          <button
            onClick={() => setIsCleanMode(false)}
            className="absolute top-6 right-6 z-40 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-mono flex items-center gap-2 shadow-2xl transition-all"
          >
            <Eye size={14} />
            Show Interface
          </button>
        )}
      </div>
    </section>
  );
};
