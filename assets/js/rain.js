/**
 * ESCAPE — Cinematic Rain & Window Glass Simulation
 * 
 * Creates two complementary atmospheric layers:
 * 1. Distant falling rain streaks outside the window
 * 2. Static and trickling condensation droplets on the glass
 * 3. Warm amber light refraction for droplets near the lamp
 */

class RainSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Canvas dimensions & DPI scaling
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Rain configuration
    this.streaks = [];
    this.droplets = [];
    this.streakCount = Math.min(Math.floor(this.width * 0.12), 120);
    this.dropletCount = Math.min(Math.floor(this.width * 0.08), 85);
    
    // Ambient light coordinates for color refraction
    this.lampX = 0;
    this.lampY = this.height;
    this.lampRadius = Math.max(this.width, this.height) * 0.55;

    this.lastTime = performance.now();
    this.isRunning = true;

    this.init();
  }

  init() {
    this.resize();
    this.createStreaks();
    this.createDroplets();

    window.addEventListener('resize', () => this.handleResize(), { passive: true });
    
    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.lampX = this.width * 0.05;
    this.lampY = this.height * 0.95;
    this.lampRadius = Math.max(this.width, this.height) * 0.55;
  }

  handleResize() {
    this.resize();
    this.streakCount = Math.min(Math.floor(this.width * 0.12), 120);
    this.dropletCount = Math.min(Math.floor(this.width * 0.08), 85);
    this.createStreaks();
    this.createDroplets();
  }

  createStreaks() {
    this.streaks = [];
    for (let i = 0; i < this.streakCount; i++) {
      this.streaks.push({
        x: Math.random() * (this.width + 100) - 50,
        y: Math.random() * this.height,
        length: Math.random() * 22 + 12,
        speed: Math.random() * 8 + 9,
        opacity: Math.random() * 0.18 + 0.05,
        thickness: Math.random() * 0.9 + 0.5,
        slant: 1.8 + Math.random() * 0.8
      });
    }
  }

  createDroplets() {
    this.droplets = [];
    for (let i = 0; i < this.dropletCount; i++) {
      this.droplets.push(this.newDroplet());
    }
  }

  newDroplet(presetY = null) {
    const isTrickler = Math.random() < 0.18; // Some droplets run down the glass
    const radius = isTrickler ? Math.random() * 2.2 + 1.2 : Math.random() * 1.8 + 0.8;
    return {
      x: Math.random() * this.width,
      y: presetY !== null ? presetY : Math.random() * this.height,
      radius: radius,
      baseRadius: radius,
      opacity: Math.random() * 0.35 + 0.2,
      isTrickler: isTrickler,
      trickleSpeed: Math.random() * 0.4 + 0.1,
      trail: [],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005
    };
  }

  getDropletColor(x, y, alpha) {
    // Check distance to warm lamp in the bottom corner
    const dx = x - this.lampX;
    const dy = y - this.lampY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const warmRatio = Math.max(0, 1 - dist / this.lampRadius);

    if (warmRatio > 0.05) {
      // Warm amber refraction
      const r = Math.round(180 + warmRatio * 60);
      const g = Math.round(140 + warmRatio * 45);
      const b = Math.round(110 + (1 - warmRatio) * 60);
      return `rgba(${r}, ${g}, ${b}, ${alpha * (0.8 + warmRatio * 0.5)})`;
    } else {
      // Cool misty slate blue refraction
      return `rgba(165, 185, 210, ${alpha})`;
    }
  }

  animate(currentTime) {
    if (!this.isRunning) return;

    const delta = Math.min((currentTime - this.lastTime) / 16.67, 2.5);
    this.lastTime = currentTime;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw falling background rain streaks
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i];
      s.y += s.speed * delta;
      s.x -= (s.slant * 0.5) * delta;

      if (s.y > this.height + s.length) {
        s.y = -s.length;
        s.x = Math.random() * (this.width + 100) - 50;
      }

      const color = this.getDropletColor(s.x, s.y, s.opacity);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = s.thickness;

      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.slant, s.y + s.length);
      this.ctx.stroke();
    }

    // 2. Draw static & trickling windowpane droplets
    for (let i = 0; i < this.droplets.length; i++) {
      const d = this.droplets[i];

      // Slow organic trickle
      if (d.isTrickler) {
        d.y += d.trickleSpeed * delta;
        d.wobble += d.wobbleSpeed;
        d.x += Math.sin(d.wobble) * 0.15;

        // Record trickle trail
        if (Math.random() < 0.3) {
          d.trail.push({ x: d.x, y: d.y, r: d.radius * 0.6, alpha: d.opacity * 0.45 });
          if (d.trail.length > 12) d.trail.shift();
        }

        // Reset when reaching bottom of glass
        if (d.y > this.height + 10) {
          Object.assign(d, this.newDroplet(-10));
        }
      }

      // Draw faint wet trail left behind by trickling drop
      if (d.trail.length > 0) {
        for (let t = 0; t < d.trail.length; t++) {
          const pt = d.trail[t];
          pt.alpha *= 0.995;
          if (pt.alpha > 0.05) {
            this.ctx.fillStyle = this.getDropletColor(pt.x, pt.y, pt.alpha);
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
      }

      // Draw droplet body
      const mainColor = this.getDropletColor(d.x, d.y, d.opacity);
      this.ctx.fillStyle = mainColor;
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Subtle light specular highlight on droplet edge
      const highlightColor = this.getDropletColor(d.x, d.y, d.opacity * 1.5);
      this.ctx.fillStyle = highlightColor;
      this.ctx.beginPath();
      this.ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
    }

    requestAnimationFrame(this.animate);
  }
}

// Export initialization hook
window.RainSimulation = RainSimulation;
