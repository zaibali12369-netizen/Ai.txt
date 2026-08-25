import React, { useState } from 'react';
import { VFXConfig } from './types';
import { Navbar } from './components/Navbar';
import { CinematicHero } from './components/CinematicHero';
import { AppCatalogSection } from './components/AppCatalogSection';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { Footer } from './components/Footer';

export default function App() {
  // Global VFX Engine Configuration (Preserves lighting, canvas plasma arcs, and audio for download hero)
  const [config, setConfig] = useState<VFXConfig>({
    energyIntensity: 1.0,
    electricArcFrequency: 1.2,
    arcBranching: 3,
    particleCount: 75,
    particleSpeed: 1.0,
    colorTheme: 'cyber-orange',
    pulseSpeed: 1.0,
    anamorphicStreaks: true,
    hologramOverlay: true,
    cameraPushIn: true,
    cameraPushSpeed: 1.0,
    parallaxStrength: 0.8,
    audioEnabled: false,
    audioVolume: 0.35,
    videoSourceMode: 'hybrid',
    hudOverlay: true,
  });

  // Modal state
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* 1. Header Navigation */}
      <Navbar
        config={config}
        setConfig={setConfig}
        onOpenControls={() => {}}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* 2. Original Download Hero Section with Robot Visual, Plasma Effects & Clean Left Typography */}
      <main className="flex-1 w-full flex flex-col items-center">
        <CinematicHero
          config={config}
          setConfig={setConfig}
          onOpenControls={() => {}}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        />

        {/* 3. Live Download Application Repository (Auto synchronized every 2-3 seconds) */}
        <AppCatalogSection />
      </main>

      {/* 4. Clean Footer */}
      <Footer />

      {/* Live Diagnostics & Telemetry Modal */}
      <DiagnosticsPanel
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}
