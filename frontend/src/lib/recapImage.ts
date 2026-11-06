// Draws the weekly recap as a square image for sharing in group chats and
// social media. Plain canvas drawing, so it needs no libraries.

export type RecapStat = { value: number; label: string };

const VIOLET = '#7350F5';
const VIOLET_DARK = '#4329A8';
const GOLD = '#F5B82E';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, weight: number, size: number) {
  let current = size;
  ctx.font = `${weight} ${current}px Nunito, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && current > 18) {
    current -= 2;
    ctx.font = `${weight} ${current}px Nunito, sans-serif`;
  }
}

export async function drawRecapImage({
  title,
  dateRange,
  stats,
  streak,
  companies,
}: {
  title: string;
  dateRange: string;
  stats: RecapStat[];
  streak: number;
  companies: string[];
}): Promise<Blob> {
  // Make sure the app's font is ready before drawing with it.
  try {
    await Promise.all([document.fonts.load('900 64px Nunito'), document.fonts.load('700 32px Nunito')]);
  } catch {
    // Falls back to the system font.
  }

  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not draw the image.');

  // Background
  ctx.fillStyle = VIOLET;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.arc(size - 80, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  // Heading
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'alphabetic';
  fitText(ctx, title, size - 160, 900, 76);
  ctx.fillText(title, 80, 170);
  ctx.font = '700 36px Nunito, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(dateRange, 80, 225);

  // Stat tiles, two per row
  const shown = stats.slice(0, 4);
  const gap = 32;
  const tileW = (size - 160 - gap) / 2;
  const tileH = 230;
  shown.forEach((stat, index) => {
    const x = 80 + (index % 2) * (tileW + gap);
    const y = 290 + Math.floor(index / 2) * (tileH + gap);
    ctx.fillStyle = '#FFFFFF';
    roundedRect(ctx, x, y, tileW, tileH, 36);
    ctx.fill();
    ctx.fillStyle = VIOLET_DARK;
    roundedRect(ctx, x, y + tileH - 14, tileW, 14, 7);
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = VIOLET;
    ctx.font = '900 110px Nunito, sans-serif';
    ctx.fillText(String(stat.value), x + 40, y + 135);
    ctx.fillStyle = '#44403C';
    fitText(ctx, stat.label, tileW - 80, 800, 36);
    ctx.fillText(stat.label, x + 40, y + 190);
  });

  // Streak and companies
  const footerY = shown.length > 2 ? 870 : 610;
  if (streak > 0) {
    ctx.fillStyle = GOLD;
    roundedRect(ctx, 80, footerY - 60, 420, 84, 42);
    ctx.fill();
    ctx.fillStyle = '#5B3A00';
    ctx.font = '900 40px Nunito, sans-serif';
    ctx.fillText(`${streak}-day streak`, 120, footerY - 4);
  }
  if (companies.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const text = `Applied to ${companies.join(', ')}`;
    fitText(ctx, text, size - 160, 700, 30);
    ctx.fillText(text, 80, footerY + (streak > 0 ? 80 : 0));
  }

  // Wordmark
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '900 34px Nunito, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Onward', size - 80, size - 70);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png'),
  );
}
