export interface VFXConfig {
  energyIntensity: number; // 0.1 to 2.0
  electricArcFrequency: number; // 0.1 to 3.0
  arcBranching: number; // 1 to 5
  particleCount: number; // 20 to 200
  particleSpeed: number; // 0.2 to 3.0
  colorTheme: 'cyber-orange' | 'obsidian-purple' | 'quantum-cyan' | 'solar-gold' | 'crimson-pulse';
  pulseSpeed: number; // 0.2 to 3.0
  anamorphicStreaks: boolean;
  hologramOverlay: boolean;
  cameraPushIn: boolean;
  cameraPushSpeed: number; // 0.1 to 2.0
  parallaxStrength: number; // 0 to 1.5
  audioEnabled: boolean;
  audioVolume: number; // 0 to 1
  videoSourceMode: 'stream' | 'canvas-vfx' | 'hybrid';
  hudOverlay: boolean;
}

export interface TelemetryData {
  synapticLoad: number;
  coreVoltage: number;
  temperatureCelsius: number;
  fluxDensity: number;
  quantumCoherence: number;
  actuatorResponseMs: number;
  neuralPathwaysActive: number;
  batteryReserve: number;
  activeProcesses: string[];
}

export interface RobotModule {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  efficiency: string;
  specs: { label: string; value: string }[];
  status: 'OPTIMAL' | 'OVERCLOCKED' | 'SYNCHRONIZED';
}
