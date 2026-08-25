import { VFXConfig } from '../types';

interface Particle {
  x: number;
  y: number;
  z: number; // depth 0.2 to 2.0
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
  electricLife?: number;
}

interface ArcPoint {
  x: number;
  y: number;
}

interface ElectricalArc {
  points: ArcPoint[];
  color: string;
  glowColor: string;
  width: number;
  alpha: number;
  life: number;
  maxLife: number;
  branches: ElectricalArc[];
}

export class CyberCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private arcs: ElectricalArc[] = [];
  private animId: number | null = null;
  private lastTime: number = 0;
  private config: VFXConfig;
  private mousePos: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  private timeElapsed: number = 0;
  private lastArcSpawn: number = 0;

  constructor(canvas: HTMLCanvasElement, config: VFXConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.config = config;
    this.initParticles();
  }

  public updateConfig(newConfig: VFXConfig) {
    this.config = newConfig;
    if (this.particles.length !== Math.floor(newConfig.particleCount)) {
      this.initParticles();
    }
  }

  public setMousePosition(x: number, y: number, active: boolean) {
    this.mousePos = { x, y, active };
  }

  private getColorPalette() {
    switch (this.config.colorTheme) {
      case 'obsidian-purple':
        return {
          primaryArc: 'rgba(230, 180, 255, 1)',
          secondaryArc: 'rgba(168, 85, 247, 0.9)',
          glow: 'rgba(192, 38, 211, 0.6)',
          internalPulse: 'rgba(217, 70, 239, 0.85)',
          ember: '#c084fc',
          particleAlt: '#f472b6',
        };
      case 'quantum-cyan':
        return {
          primaryArc: 'rgba(220, 250, 255, 1)',
          secondaryArc: 'rgba(6, 182, 212, 0.9)',
          glow: 'rgba(14, 165, 233, 0.6)',
          internalPulse: 'rgba(56, 189, 248, 0.85)',
          ember: '#38bdf8',
          particleAlt: '#67e8f9',
        };
      case 'solar-gold':
        return {
          primaryArc: 'rgba(255, 250, 220, 1)',
          secondaryArc: 'rgba(245, 158, 11, 0.9)',
          glow: 'rgba(217, 119, 6, 0.6)',
          internalPulse: 'rgba(251, 191, 36, 0.85)',
          ember: '#f59e0b',
          particleAlt: '#fbbf24',
        };
      case 'crimson-pulse':
        return {
          primaryArc: 'rgba(255, 220, 220, 1)',
          secondaryArc: 'rgba(239, 68, 68, 0.9)',
          glow: 'rgba(220, 38, 38, 0.6)',
          internalPulse: 'rgba(248, 113, 113, 0.85)',
          ember: '#f87171',
          particleAlt: '#f43f5e',
        };
      case 'cyber-orange':
      default:
        return {
          primaryArc: 'rgba(240, 248, 255, 1)',
          secondaryArc: 'rgba(56, 189, 248, 0.95)',
          glow: 'rgba(14, 165, 233, 0.65)',
          internalPulse: 'rgba(249, 115, 22, 0.85)',
          ember: '#fb923c',
          particleAlt: '#38bdf8',
        };
    }
  }

  private initParticles() {
    const count = Math.floor(this.config.particleCount);
    this.particles = [];
    const w = this.canvas.width || 1920;
    const h = this.canvas.height || 1080;
    const palette = this.getColorPalette();

    for (let i = 0; i < count; i++) {
      const z = 0.3 + Math.random() * 1.7;
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        vx: (Math.random() - 0.5) * 0.4 * z * this.config.particleSpeed,
        vy: (-0.3 - Math.random() * 0.5) * z * this.config.particleSpeed,
        size: (0.8 + Math.random() * 2.2) * z,
        alpha: Math.random() * 0.7 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.4 ? palette.ember : palette.particleAlt,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Generates fractal lightning bolt between two points using midpoint displacement
   */
  private generateFractalArc(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number,
    depth: number = 4
  ): ArcPoint[] {
    let points: ArcPoint[] = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    let currentDisplace = displace;

    for (let i = 0; i < depth; i++) {
      const newPoints: ArcPoint[] = [];
      for (let j = 0; j < points.length - 1; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Perpendicular normal vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        const offset = (Math.random() - 0.5) * currentDisplace;
        newPoints.push(p1);
        newPoints.push({
          x: midX + nx * offset,
          y: midY + ny * offset,
        });
      }
      newPoints.push(points[points.length - 1]);
      points = newPoints;
      currentDisplace *= 0.52;
    }
    return points;
  }

  private spawnElectricArc() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const palette = this.getColorPalette();

    // Key anatomical anchor areas for the robot (around head, helmet ears, jaw, neck, collar)
    const centerX = w * 0.5;
    const headTopY = h * 0.30;
    const neckY = h * 0.58;
    const shoulderLeftX = w * 0.38;
    const shoulderRightX = w * 0.62;

    const arcTypes = [
      // 1. Helmet temple to ear circuit
      () => {
        const isLeft = Math.random() > 0.5;
        const startX = centerX + (isLeft ? -w * 0.08 : w * 0.08);
        const startY = headTopY + (Math.random() * 0.15) * h;
        const endX = startX + (isLeft ? -w * 0.07 : w * 0.07) + (Math.random() - 0.5) * 30;
        const endY = startY + (Math.random() - 0.3) * 60;
        return { startX, startY, endX, endY, displace: 35 };
      },
      // 2. Neck hydraulic conduit spark
      () => {
        const isLeft = Math.random() > 0.5;
        const startX = centerX + (isLeft ? -w * 0.04 : w * 0.04);
        const startY = neckY + (Math.random() - 0.5) * 40;
        const endX = startX + (isLeft ? -w * 0.05 : w * 0.05);
        const endY = startY + 45 + Math.random() * 30;
        return { startX, startY, endX, endY, displace: 28 };
      },
      // 3. Shoulder collar micro-arc
      () => {
        const isLeft = Math.random() > 0.5;
        const startX = isLeft ? shoulderLeftX + (Math.random() - 0.5) * 40 : shoulderRightX + (Math.random() - 0.5) * 40;
        const startY = h * 0.68 + (Math.random() - 0.5) * 30;
        const endX = startX + (isLeft ? -35 : 35);
        const endY = startY + (Math.random() - 0.5) * 40;
        return { startX, startY, endX, endY, displace: 25 };
      },
      // 4. Ambient atmospheric plasma arc drifting in background
      () => {
        const startX = (Math.random() > 0.5 ? 0.2 : 0.8) * w + (Math.random() - 0.5) * 100;
        const startY = 0.2 * h + Math.random() * 0.6 * h;
        const endX = startX + (Math.random() - 0.5) * 120;
        const endY = startY + (Math.random() - 0.5) * 100;
        return { startX, startY, endX, endY, displace: 45 };
      },
    ];

    const chosen = arcTypes[Math.floor(Math.random() * arcTypes.length)]();
    const points = this.generateFractalArc(
      chosen.startX,
      chosen.startY,
      chosen.endX,
      chosen.endY,
      chosen.displace
    );

    // Create optional branches
    const branches: ElectricalArc[] = [];
    const branchChance = 0.6 * (this.config.arcBranching / 3);

    if (Math.random() < branchChance && points.length > 4) {
      const branchIndex = Math.floor(points.length * (0.3 + Math.random() * 0.4));
      const bp = points[branchIndex];
      const bx2 = bp.x + (Math.random() - 0.5) * 60;
      const by2 = bp.y + (Math.random() - 0.5) * 60;
      const branchPoints = this.generateFractalArc(bp.x, bp.y, bx2, by2, chosen.displace * 0.6, 3);

      branches.push({
        points: branchPoints,
        color: palette.secondaryArc,
        glowColor: palette.glow,
        width: 1.2 * this.config.energyIntensity,
        alpha: 0.8,
        life: 0,
        maxLife: 6 + Math.floor(Math.random() * 5),
        branches: [],
      });
    }

    this.arcs.push({
      points,
      color: Math.random() > 0.3 ? palette.primaryArc : palette.secondaryArc,
      glowColor: palette.glow,
      width: (1.5 + Math.random() * 1.5) * this.config.energyIntensity,
      alpha: 0.95,
      life: 0,
      maxLife: 8 + Math.floor(Math.random() * 8),
      branches,
    });
  }

  private drawArc(arc: ElectricalArc) {
    if (arc.points.length < 2) return;
    const progress = arc.life / arc.maxLife;
    const currentAlpha = (1 - progress) * arc.alpha;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 1. Soft Glow Pass
    this.ctx.beginPath();
    this.ctx.moveTo(arc.points[0].x, arc.points[0].y);
    for (let i = 1; i < arc.points.length; i++) {
      this.ctx.lineTo(arc.points[i].x, arc.points[i].y);
    }
    this.ctx.strokeStyle = arc.glowColor;
    this.ctx.globalAlpha = currentAlpha * 0.6;
    this.ctx.lineWidth = arc.width * 4.5;
    this.ctx.stroke();

    // 2. Intense Core Pass
    this.ctx.beginPath();
    this.ctx.moveTo(arc.points[0].x, arc.points[0].y);
    for (let i = 1; i < arc.points.length; i++) {
      this.ctx.lineTo(arc.points[i].x, arc.points[i].y);
    }
    this.ctx.strokeStyle = arc.color;
    this.ctx.globalAlpha = currentAlpha;
    this.ctx.lineWidth = Math.max(0.8, arc.width);
    this.ctx.stroke();

    // Spark nodes at vertices
    for (let i = 0; i < arc.points.length; i += 3) {
      const p = arc.points[i];
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = currentAlpha * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, arc.width * 0.9, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    // Render child branches
    arc.branches.forEach((b) => this.drawArc(b));
  }

  /**
   * Internal Conduits & Neck Glow Lighting Pulses
   */
  private drawInternalEnergyPulses(time: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const palette = this.getColorPalette();
    const speed = this.config.pulseSpeed;
    const intensity = this.config.energyIntensity;

    const pulse = Math.sin(time * speed * 2.2) * 0.35 + 0.65;
    const pulseFast = Math.sin(time * speed * 5.0) * 0.2 + 0.8;

    const centerX = w * 0.5;

    // Glowing internal nodes mapped to robot's anatomy
    const nodes = [
      // Throat conduit center
      { x: centerX, y: h * 0.52, radius: 35, energy: pulse * 0.5 },
      // Left neck conduit
      { x: centerX - w * 0.035, y: h * 0.55, radius: 28, energy: pulseFast * 0.6 },
      // Right neck conduit
      { x: centerX + w * 0.035, y: h * 0.55, radius: 28, energy: pulseFast * 0.6 },
      // Chest tie & central junction
      { x: centerX, y: h * 0.66, radius: 45, energy: pulse * 0.7 },
      // Left collar joint
      { x: centerX - w * 0.09, y: h * 0.64, radius: 25, energy: pulse * 0.4 },
      // Right collar joint
      { x: centerX + w * 0.09, y: h * 0.64, radius: 25, energy: pulse * 0.4 },
      // Visor subtle temple glint
      { x: centerX - w * 0.065, y: h * 0.36, radius: 18, energy: pulseFast * 0.45 },
      { x: centerX + w * 0.065, y: h * 0.36, radius: 18, energy: pulseFast * 0.45 },
    ];

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    nodes.forEach((node) => {
      const rad = node.radius * (0.8 + 0.2 * node.energy);
      const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, rad);
      gradient.addColorStop(0, palette.internalPulse);
      gradient.addColorStop(0.4, palette.glow);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.globalAlpha = node.energy * 0.45 * intensity;
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  /**
   * Anamorphic Specular Light Streaks across metallic helmet surface
   */
  private drawAnamorphicGlint(time: number) {
    if (!this.config.anamorphicStreaks) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const palette = this.getColorPalette();

    // Slowly moving horizontal beam sweep
    const sweepY = h * 0.34 + Math.sin(time * 0.8) * (h * 0.08);
    const sweepX = w * 0.5 + Math.cos(time * 0.5) * (w * 0.12);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    const beamGrad = this.ctx.createLinearGradient(sweepX - 250, sweepY, sweepX + 250, sweepY);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    beamGrad.addColorStop(0.3, palette.glow);
    beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    beamGrad.addColorStop(0.7, palette.glow);
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.globalAlpha = 0.25 * this.config.energyIntensity;
    this.ctx.fillStyle = beamGrad;
    this.ctx.fillRect(sweepX - 250, sweepY - 2, 500, 4);

    this.ctx.restore();
  }

  /**
   * High-Tech Holographic Grid & HUD overlay
   */
  private drawHologramHUD(time: number) {
    if (!this.config.hudOverlay && !this.config.hologramOverlay) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const palette = this.getColorPalette();
    const cx = w * 0.5;
    const cy = h * 0.45;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.strokeStyle = palette.particleAlt;
    this.ctx.fillStyle = palette.particleAlt;
    this.ctx.lineWidth = 1;

    // Reticle brackets around central robot
    const bracketSize = Math.min(w, h) * 0.28;
    const corner = 24;

    this.ctx.globalAlpha = 0.22;
    // Top-Left
    this.ctx.beginPath();
    this.ctx.moveTo(cx - bracketSize, cy - bracketSize + corner);
    this.ctx.lineTo(cx - bracketSize, cy - bracketSize);
    this.ctx.lineTo(cx - bracketSize + corner, cy - bracketSize);
    this.ctx.stroke();

    // Top-Right
    this.ctx.beginPath();
    this.ctx.moveTo(cx + bracketSize - corner, cy - bracketSize);
    this.ctx.lineTo(cx + bracketSize, cy - bracketSize);
    this.ctx.lineTo(cx + bracketSize, cy - bracketSize + corner);
    this.ctx.stroke();

    // Bottom-Left
    this.ctx.beginPath();
    this.ctx.moveTo(cx - bracketSize, cy + bracketSize - corner);
    this.ctx.lineTo(cx - bracketSize, cy + bracketSize);
    this.ctx.lineTo(cx - bracketSize + corner, cy + bracketSize);
    this.ctx.stroke();

    // Bottom-Right
    this.ctx.beginPath();
    this.ctx.moveTo(cx + bracketSize - corner, cy + bracketSize);
    this.ctx.lineTo(cx + bracketSize, cy + bracketSize);
    this.ctx.lineTo(cx + bracketSize, cy + bracketSize - corner);
    this.ctx.stroke();

    // Subtle rotating telemetry ring
    const ringAngle = time * 0.2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, bracketSize * 1.15, ringAngle, ringAngle + Math.PI * 0.4);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, bracketSize * 1.15, ringAngle + Math.PI, ringAngle + Math.PI * 1.4);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private updateParticles(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mx = this.mousePos.active ? this.mousePos.x : w * 0.5;
    const my = this.mousePos.active ? this.mousePos.y : h * 0.5;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      // Mouse attraction / disturbance when hovering
      if (this.mousePos.active) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 220) {
          const force = (1 - dist / 220) * 0.6;
          p.x += (dx / dist) * force * p.z;
          p.y += (dy / dist) * force * p.z;
        }
      }

      // Sine pulse
      p.pulsePhase += dt * 2.5;
      p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.25;

      // Wrap around bounds
      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
    }
  }

  private drawParticles() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * this.config.energyIntensity));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Soft glow for larger foreground embers
      if (p.size > 2.0) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        this.ctx.globalAlpha = p.alpha * 0.15;
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  private updateArcs(dt: number) {
    // Spawn new arcs based on frequency
    const arcInterval = 1 / Math.max(0.2, this.config.electricArcFrequency * 2.8);
    if (this.timeElapsed - this.lastArcSpawn > arcInterval) {
      this.spawnElectricArc();
      this.lastArcSpawn = this.timeElapsed;
    }

    // Update existing arcs
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const arc = this.arcs[i];
      arc.life++;
      if (arc.life >= arc.maxLife) {
        this.arcs.splice(i, 1);
      }
    }
  }

  public render(timestamp: number = performance.now()) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.timeElapsed += dt;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw atmospheric particles
    this.updateParticles(dt);
    this.drawParticles();

    // 2. Draw Internal Energy Conduits & Neck Glow
    this.drawInternalEnergyPulses(this.timeElapsed);

    // 3. Draw Specular Streaks across helmet
    this.drawAnamorphicGlint(this.timeElapsed);

    // 4. Draw HUD / Holographic brackets
    this.drawHologramHUD(this.timeElapsed);

    // 5. Update & draw electrical lightning arcs
    this.updateArcs(dt);
    for (let i = 0; i < this.arcs.length; i++) {
      this.drawArc(this.arcs[i]);
    }

    this.animId = requestAnimationFrame((t) => this.render(t));
  }

  public start() {
    if (!this.animId) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame((t) => this.render(t));
    }
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
