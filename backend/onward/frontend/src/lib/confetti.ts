import { prefersReducedMotion } from './preferences';

// A small, dependency-free confetti effect drawn on one shared canvas.

const COLORS = ['#7350F5', '#9D85FB', '#F5B82E', '#FCD57A', '#10B981', '#F472B6', '#38BDF8'];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  wobble: number;
  life: number;
  shape: 'rect' | 'circle';
};

let canvas: HTMLCanvasElement | null = null;
let particles: Particle[] = [];
let frame = 0;

function ensureCanvas() {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '60',
  });
  document.body.appendChild(canvas);
  return canvas;
}

function resize(target: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  target.width = window.innerWidth * ratio;
  target.height = window.innerHeight * ratio;
  target.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function tick() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
  for (const p of particles) {
    p.vy += 0.32; // gravity
    p.vx *= 0.985; // air resistance
    p.vy *= 0.985;
    p.x += p.vx + Math.sin(p.wobble) * 0.6;
    p.y += p.vy;
    p.wobble += 0.12;
    p.rotation += p.spin;
    p.life -= 1;

    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Scaling by cos(wobble) makes the paper look like it's flipping.
      ctx.scale(1, Math.cos(p.wobble));
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
    }
    ctx.restore();
  }

  if (particles.length > 0) {
    frame = requestAnimationFrame(tick);
  } else {
    canvas.remove();
    canvas = null;
    frame = 0;
  }
}

type BurstOptions = {
  x: number;
  y: number;
  count?: number;
  /** Direction in degrees: -90 is straight up. */
  angle?: number;
  /** How wide the burst fans out, in degrees. */
  spread?: number;
  power?: number;
};

export function burst({ x, y, count = 60, angle = -90, spread = 70, power = 12 }: BurstOptions) {
  if (prefersReducedMotion()) return;
  const target = ensureCanvas();
  if (!frame) resize(target);

  for (let i = 0; i < count; i++) {
    const direction = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = power * (0.55 + Math.random() * 0.6);
    particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      size: 7 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * 10,
      life: 110 + Math.random() * 60,
      shape: Math.random() < 0.3 ? 'circle' : 'rect',
    });
  }

  if (!frame) frame = requestAnimationFrame(tick);
}

/** The big one: confetti from both bottom corners and the top. */
export function celebrateFullScreen() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  burst({ x: 0, y: h, angle: -60, spread: 40, count: 90, power: 22 });
  burst({ x: w, y: h, angle: -120, spread: 40, count: 90, power: 22 });
  setTimeout(() => burst({ x: w / 2, y: h * 0.35, angle: -90, spread: 160, count: 120, power: 14 }), 350);
}
