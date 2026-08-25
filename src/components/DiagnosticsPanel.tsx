import React, { useState, useEffect } from 'react';
import { TelemetryData } from '../types';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  X, 
  Activity, 
  Zap, 
  Cpu, 
  Thermometer, 
  ShieldCheck, 
  RefreshCw,
  Terminal,
  Radio,
  RadioTower,
  Gauge
} from 'lucide-react';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ isOpen, onClose }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    synapticLoad: 68.4,
    coreVoltage: 480.2,
    temperatureCelsius: 36.8,
    fluxDensity: 1.42,
    quantumCoherence: 99.88,
    actuatorResponseMs: 1.2,
    neuralPathwaysActive: 16384,
    batteryReserve: 98.6,
    activeProcesses: [
      'MTUBE_MOTOR_DYNAMICS.sys [SYNCED]',
      'QUANTUM_SYNAPSE_MATRIX.bin [STABLE]',
      'PLASMA_ENERGY_REGULATOR.svc [NOMINAL]',
      'ANAMORPHIC_OPTICAL_BUS.drv [60 FPS]',
    ],
  });

  const [isSurgeRunning, setIsSurgeRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '12:00:01.04 [CORE] Neural network booted. 16,384 pathways verified.',
    '12:00:01.42 [PLASMA] Internal conduits energized at 480 kV.',
    '12:00:02.10 [OPTICS] Specular glint engine calibrated to 60 FPS.',
    '12:00:02.80 [AUTONOMOUS] Ready for human interaction & real-time telemetry.',
  ]);

  // Live telemetry fluctuating tick
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        synapticLoad: Number((65 + Math.random() * 8).toFixed(1)),
        coreVoltage: Number((479 + Math.random() * 3).toFixed(1)),
        temperatureCelsius: Number((36.5 + Math.random() * 0.8).toFixed(1)),
        quantumCoherence: Number((99.8 + Math.random() * 0.15).toFixed(2)),
        actuatorResponseMs: Number((1.1 + Math.random() * 0.2).toFixed(1)),
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerEnergySurge = () => {
    setIsSurgeRunning(true);
    audioEngine.triggerSparkSound();
    audioEngine.triggerPulseChirp();

    setLogs((prev) => [
      `${new Date().toLocaleTimeString()} [SURGE] High-voltage plasma pulse injected across neck conduits.`,
      ...prev.slice(0, 7),
    ]);

    setTelemetry((prev) => ({
      ...prev,
      coreVoltage: 540.8,
      synapticLoad: 94.2,
      fluxDensity: 2.15,
    }));

    setTimeout(() => {
      setIsSurgeRunning(false);
      setLogs((prev) => [
        `${new Date().toLocaleTimeString()} [SURGE] Harmonics stabilized. Core returning to nominal 480 kV.`,
        ...prev.slice(0, 7),
      ]);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0a0d13] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white tracking-wide flex items-center gap-2">
                MTUBE CYBERNETIC DIAGNOSTICS
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  LIVE STREAM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time biological-synthetic neural telemetry & actuator metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Synaptic Load</span>
                <Cpu size={14} className="text-orange-400" />
              </div>
              <div className="text-xl font-bold font-display text-white">
                {telemetry.synapticLoad}%
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-500"
                  style={{ width: `${telemetry.synapticLoad}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Core Voltage</span>
                <Zap size={14} className="text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-display text-cyan-300">
                {telemetry.coreVoltage} <span className="text-xs font-normal">kV</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full transition-all duration-500"
                  style={{ width: `${(telemetry.coreVoltage / 600) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Thermal Dissipation</span>
                <Thermometer size={14} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-display text-white">
                {telemetry.temperatureCelsius}°C
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${(telemetry.temperatureCelsius / 60) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Coherence</span>
                <ShieldCheck size={14} className="text-violet-400" />
              </div>
              <div className="text-xl font-bold font-display text-violet-300">
                {telemetry.quantumCoherence}%
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-400 h-full transition-all duration-500"
                  style={{ width: `${telemetry.quantumCoherence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actuator & Conduit Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-mono tracking-wider text-orange-400 uppercase flex items-center gap-2">
                <Gauge size={14} /> Subsystem Status Matrix
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Actuator Response Latency</span>
                  <span className="font-mono text-emerald-400">{telemetry.actuatorResponseMs} ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Active Synthetic Pathways</span>
                  <span className="font-mono text-white">{telemetry.neuralPathwaysActive.toLocaleString()} nodes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Magnetic Flux Density</span>
                  <span className="font-mono text-cyan-300">{telemetry.fluxDensity} Tesla</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Solid-State Battery Reserve</span>
                  <span className="font-mono text-amber-300">{telemetry.batteryReserve}%</span>
                </div>
              </div>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-mono tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                <RadioTower size={14} /> Active Service Daemons
              </h3>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                {telemetry.activeProcesses.map((proc, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1 px-2 rounded bg-white/5 border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>{proc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Terminal Log Stream */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Terminal size={14} /> Neural Telemetry Event Stream
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                POLLING 60Hz
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-300 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={triggerEnergySurge}
              disabled={isSurgeRunning}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                isSurgeRunning
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110 shadow-orange-500/20'
              }`}
            >
              <Zap size={14} />
              {isSurgeRunning ? 'INJECTING SURGE...' : 'TEST ELECTRICAL SURGE PULSE'}
            </button>

            <button
              onClick={() => {
                audioEngine.triggerPulseChirp();
                setLogs((prev) => [
                  `${new Date().toLocaleTimeString()} [CALIB] Dynamic impedance balanced across all micro-actuators.`,
                  ...prev,
                ]);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs tracking-wider transition-all border border-white/10 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Recalibrate Impedance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
