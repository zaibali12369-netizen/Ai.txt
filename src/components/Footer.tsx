import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Download, 
  MessageCircle, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Lock, 
  HardDrive, 
  Calendar, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  FolderOpen
} from 'lucide-react';
import { AppItem, fetchLiveApps } from '../services/appDataService';
import { audioEngine } from '../utils/audioSynthesizer';

export const Footer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live file repository state (Clean showcase only)
  const [liveApps, setLiveApps] = useState<AppItem[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'premium' | 'normal'>('all');
  const appsJsonRef = useRef<string>('');

  // Mouse tracking for 3D parallax
  const [panelTilt, setPanelTilt] = useState({ rotX: 0, rotY: 0 });

  // Interactive hover for central console
  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPanelTilt({
      rotX: -y * 6,
      rotY: x * 6,
    });
  };

  const handlePanelMouseLeave = () => {
    setPanelTilt({ rotX: 0, rotY: 0 });
  };

  const handleChatWithOwner = () => {
    audioEngine.triggerPulseChirp();
    const msg = encodeURIComponent('Hello Owner, I have a query about MTube app downloads and premium activation.');
    window.open(`https://wa.me/923035945138?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  // Synchronize live apps from the existing single source of truth
  const syncLiveApps = async (isBackground: boolean = false) => {
    if (!isBackground && liveApps.length === 0) {
      setIsLoadingApps(true);
    }
    try {
      const res = await fetchLiveApps(false);
      if (res.apps && res.apps.length > 0) {
        const newJson = JSON.stringify(res.apps);
        if (newJson !== appsJsonRef.current) {
          appsJsonRef.current = newJson;
          setLiveApps(res.apps);
        }
      }
    } catch {
      // Fallback handled inside appDataService
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Initial load and live background polling every 2 seconds + focus synchronization
  useEffect(() => {
    syncLiveApps(false);

    const interval = setInterval(() => {
      if (!document.hidden) {
        syncLiveApps(true);
      }
    }, 2000);

    const handleFocusOrVisibility = () => {
      if (!document.hidden) {
        syncLiveApps(true);
      }
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  // Filter live apps by Category
  const displayedApps = liveApps.filter((app) => {
    if (activeTab === 'premium') return app.accessType === 'premium';
    if (activeTab === 'normal') return app.accessType !== 'premium';
    return true;
  });

  const premiumCount = liveApps.filter((a) => a.accessType === 'premium').length;
  const normalCount = liveApps.filter((a) => a.accessType !== 'premium').length;

  // Three.js 3D Background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050e, 0.028);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    // 2. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x06152d, 2.5);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x00f0ff, 4, 25);
    cyanPointLight.position.set(0, 3, 2);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0xc026d3, 3.5, 20);
    purplePointLight.position.set(-4, -1, 3);
    scene.add(purplePointLight);

    const orangePointLight = new THREE.PointLight(0xf97316, 3, 20);
    orangePointLight.position.set(4, 2, -2);
    scene.add(orangePointLight);

    // 3. Perspective Circuit Grid Floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x00e5ff, 0x0a2540);
    gridHelper.position.set(0, -3.8, -4);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    scene.add(gridHelper);

    // Glowing laser horizon line
    const horizonGeo = new THREE.BufferGeometry();
    const horizonPts = [new THREE.Vector3(-20, -3.78, -12), new THREE.Vector3(20, -3.78, -12)];
    horizonGeo.setFromPoints(horizonPts);
    const horizonMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, linewidth: 2, transparent: true, opacity: 0.7 });
    const horizonLine = new THREE.Line(horizonGeo, horizonMat);
    scene.add(horizonLine);

    // 4. Floating 3D Polyhedrons Group
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    interface PolyObject {
      mesh: THREE.Mesh;
      wireframe?: THREE.LineSegments;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: number;
      floatOffset: number;
      initialPos: THREE.Vector3;
    }

    const polyObjects: PolyObject[] = [];

    const createCrystalMaterial = (colorHex: number, emissiveHex: number, opacity: number = 0.85) => {
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: emissiveHex,
        emissiveIntensity: 0.45,
        roughness: 0.15,
        metalness: 0.8,
        transmission: 0.35,
        ior: 1.6,
        transparent: true,
        opacity: opacity,
        flatShading: true,
      });
    };

    const cyanMat = createCrystalMaterial(0x00b4d8, 0x00f0ff, 0.85);
    const purpleMat = createCrystalMaterial(0x7928ca, 0xd946ef, 0.85);
    const darkCrystalMat = createCrystalMaterial(0x0f172a, 0x00d2ff, 0.9);

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
    });

    const purpleWireframeMat = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.5,
    });

    const shapesConfig = [
      { geo: new THREE.IcosahedronGeometry(1.4, 0), mat: cyanMat, wire: wireframeMat, pos: [0, 2.8, -2], rot: [0.006, 0.009, 0.003], fSpeed: 1.2, fOff: 0 },
      { geo: new THREE.OctahedronGeometry(0.9, 0), mat: purpleMat, wire: purpleWireframeMat, pos: [2.3, 3.2, -3], rot: [-0.008, 0.005, 0.006], fSpeed: 1.5, fOff: 1.5 },
      { geo: new THREE.DodecahedronGeometry(1.0, 0), mat: darkCrystalMat, wire: wireframeMat, pos: [-2.4, 3.0, -3], rot: [0.005, -0.008, 0.004], fSpeed: 1.1, fOff: 3 },
      { geo: new THREE.TetrahedronGeometry(0.7, 0), mat: purpleMat, wire: purpleWireframeMat, pos: [1.2, 4.3, -4], rot: [0.01, 0.008, -0.005], fSpeed: 1.8, fOff: 2.2 },
    ];

    shapesConfig.forEach((cfg) => {
      const mesh = new THREE.Mesh(cfg.geo, cfg.mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

      const wireGeo = new THREE.WireframeGeometry(cfg.geo);
      const wireframe = new THREE.LineSegments(wireGeo, cfg.wire);
      mesh.add(wireframe);

      floatingGroup.add(mesh);

      polyObjects.push({
        mesh,
        wireframe,
        rotSpeed: { x: cfg.rot[0], y: cfg.rot[1], z: cfg.rot[2] },
        floatSpeed: cfg.fSpeed,
        floatOffset: cfg.fOff,
        initialPos: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
      });
    });

    // Particle Cloud
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 16;
      posArray[i + 1] = (Math.random() - 0.5) * 10 + 1;
      posArray[i + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate polyhedrons
      polyObjects.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeed.x;
        item.mesh.rotation.y += item.rotSpeed.y;
        item.mesh.rotation.z += item.rotSpeed.z;
        item.mesh.position.y = item.initialPos.y + Math.sin(elapsedTime * item.floatSpeed + item.floatOffset) * 0.25;
      });

      // Slowly rotate particle dust
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <footer ref={containerRef} className="relative w-full overflow-hidden bg-transparent pt-12 pb-8">
      {/* 3D WebGL Background Canvas (Preserved visible through transparent console) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-85"
      />

      {/* Main Container */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col items-center justify-center">
        
        {/* 3D Transparent Floating Console */}
        <div
          onMouseMove={handlePanelMouseMove}
          onMouseLeave={handlePanelMouseLeave}
          style={{
            transform: `rotateX(${panelTilt.rotX}deg) rotateY(${panelTilt.rotY}deg) translateZ(15px)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
          }}
          className="relative w-full rounded-[26px] bg-[#060810]/75 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 shadow-[0_15px_45px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.12)] overflow-hidden"
        >
          {/* Neon Top Glass Edge Accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          {/* Console Header Bar */}
          <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/20 via-transparent to-amber-950/20">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-cyan-500/20 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <Download size={18} className="text-orange-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white font-display">
                    MTube<span className="text-orange-400 font-mono">//DOWNLINK</span>
                  </span>
                </div>
                <div className="text-[10px] font-mono tracking-[0.22em] text-cyan-300/90 uppercase font-semibold">
                  HIGH-SPEED DISTRIBUTION NETWORK
                </div>
              </div>
            </div>

            {/* Prominent "Chat with Owner" Glowing WhatsApp Action Button */}
            <button
              onClick={handleChatWithOwner}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-white font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/40 transition-all chat-owner-btn-3d active:scale-95 cursor-pointer"
            >
              <MessageCircle size={16} className="text-white animate-bounce" />
              <span>Chat with Owner</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-1" />
            </button>
          </div>

          {/* Downloading Application Dashboard with Clean Live Showcase */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative z-10">
            
            {/* COLUMN 1 (Span 7): CLEAN LIVE REPOSITORY SHOWCASE */}
            <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
              <div>
                {/* Dynamic Clean Showcase List */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {isLoadingApps && liveApps.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-cyan-400" />
                      <span>Synchronizing live showcase streams...</span>
                    </div>
                  ) : displayedApps.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-slate-400">
                      No files available.
                    </div>
                  ) : (
                    displayedApps.map((app) => {
                      const isVIP = app.accessType === 'premium';
                      return (
                        <div
                          key={app.id}
                          className={`group relative rounded-xl border p-3 flex items-center justify-between gap-3 transition-all duration-300 backdrop-blur-xl ${
                            isVIP
                              ? 'bg-gradient-to-r from-[#18130b]/90 via-[#0e111a]/90 to-[#070910] border-amber-500/30 hover:border-amber-400/70 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.18)] card-premium-glow'
                              : 'bg-gradient-to-r from-[#0c1322]/90 via-[#080d19]/90 to-[#05070f] border-cyan-500/30 hover:border-cyan-400/70 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(6,182,212,0.18)] card-normal-glow'
                          }`}
                        >
                          {/* File Icon / Type Badge */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
                                isVIP
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                              }`}
                            >
                              {isVIP ? <Lock size={15} className="animate-pulse" /> : <ShieldCheck size={15} className="text-emerald-400" />}
                            </div>

                            {/* Title & Metadata */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-xs font-bold font-display truncate ${
                                    isVIP ? 'premium-title-shimmer' : 'normal-title-shimmer'
                                  }`}
                                >
                                  {app.name}
                                </h4>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 uppercase ${
                                    isVIP
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  }`}
                                >
                                  {isVIP ? 'VIP' : 'FREE'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <HardDrive size={10} className="text-cyan-400" />
                                  {app.fileSize}
                                </span>
                                <span>•</span>
                                <span className="uppercase text-slate-400">{app.fileType}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Calendar size={10} className="text-orange-400" />
                                  {app.date}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Clean Status Badge on Right (Showcase only, no buttons) */}
                          <div className="shrink-0">
                            <span
                              className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                                isVIP
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                              }`}
                            >
                              {isVIP ? 'VIP PROTECTED' : 'DIRECT ACCESS'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2 (Span 5): DIRECT OWNER SUPPORT */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-center">
              {/* Owner Direct Assistance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs tracking-wider uppercase border-b border-white/5 pb-2">
                  <MessageCircle size={15} className="text-emerald-400" />
                  <span>DIRECT OWNER ASSISTANCE</span>
                </div>

                <div className="space-y-2 text-xs font-tech text-slate-300">
                  <p className="leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5 text-[11px]">
                    Need a VIP authorization key, custom builds, or assistance with downloads? Reach out directly to the owner via WhatsApp.
                  </p>
                  
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>WhatsApp: <strong>03035945138</strong></span>
                  </div>
                </div>

                <button
                  onClick={handleChatWithOwner}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-900/70 via-teal-900/70 to-emerald-900/70 hover:from-emerald-800/90 hover:to-teal-800/90 text-white font-mono text-xs font-semibold tracking-wider border border-emerald-400/50 hover:border-emerald-300 transition-all shadow-[0_0_18px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 active:scale-95 chat-owner-btn-3d cursor-pointer"
                >
                  <Send size={13} className="text-emerald-300" />
                  <span>Chat with Owner on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Footer Bar */}
          <div className="px-6 sm:px-8 py-4 border-t border-white/10 bg-black/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
            {/* Legal / Info Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DOWNLINK STATUS: 100% OPERATIONAL
              </span>
              <span className="text-white/20 hidden sm:inline">|</span>
              <span>256-BIT ENCRYPTION</span>
            </div>

            {/* Copyright */}
            <div className="text-slate-400 flex items-center gap-1.5">
              <span>© {new Date().getFullYear()} MTUBE • ALL RIGHTS RESERVED</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
