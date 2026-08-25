/**
 * Web Audio API procedural Sci-Fi Synthesizer
 * Generates deep ambient reactor drone, electric arc crackles, and subtle high-tech pulses
 */

class SciFiAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private isRunning: boolean = false;
  private sparkInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio API not supported in this browser environment');
    }
  }

  public start(volume: number = 0.35) {
    this.init();
    if (!this.ctx || this.isRunning) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    this.masterGain?.gain.cancelScheduledValues(t);
    this.masterGain?.gain.setValueAtTime(0.001, t);
    this.masterGain?.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 2);

    // Deep sub-drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(55, t); // A1 note

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(110, t);

    // Sub filter
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(180, t);
    this.droneFilter.Q.setValueAtTime(4, t);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.2, t);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain!);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Start random subtle electrical crackles
    this.sparkInterval = window.setInterval(() => {
      if (Math.random() < 0.6) {
        this.triggerSparkSound();
      }
    }, 1800);

    this.isRunning = true;
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;
    this.masterGain?.gain.cancelScheduledValues(t);
    this.masterGain?.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.droneFilter?.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.isRunning = false;
      if (this.sparkInterval) {
        clearInterval(this.sparkInterval);
        this.sparkInterval = null;
      }
    }, 1300);
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), t + 0.1);
  }

  public triggerSparkSound() {
    if (!this.ctx || !this.isRunning || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      // White noise buffer for spark
      const bufferSize = this.ctx.sampleRate * 0.08; // 80ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200 + Math.random() * 2000, t);
      filter.Q.setValueAtTime(6, t);

      const sparkGain = this.ctx.createGain();
      sparkGain.gain.setValueAtTime(0.08, t);
      sparkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

      noise.connect(filter);
      filter.connect(sparkGain);
      sparkGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.08);
    } catch {
      // ignore
    }
  }

  public triggerPulseChirp() {
    if (!this.ctx || !this.isRunning || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15);

      const chirpGain = this.ctx.createGain();
      chirpGain.gain.setValueAtTime(0.05, t);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

      osc.connect(chirpGain);
      chirpGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new SciFiAudioEngine();
