// Draws the weekly recap as a square image for sharing in group chats and
// social media. It looks like a page from a journal, the same as the recap on
// the Progress page: a dated heading, big numbers with their labels, and a
// short line that ends in Onward's mark. Plain canvas drawing, so it needs no
// libraries. The stats and their words come from recap.ts.

import { ONWARD_MARK_PATHS } from './mark';
import type { RecapStat } from './recap';

export type { RecapStat };

// The light theme's paper, ink and evergreen, so a shared image looks like the app.
const PAPER = '#F7F3EB';
const INK = '#282823';
const MUTED = '#5F5A50';
const LINE = '#DDD5C8';
const EVERGREEN = '#365543';

const SERIF = 'Spectral, Georgia, serif';
const SANS = '"DM Sans", system-ui, sans-serif';


const SIZE = 1080;
const MARGIN = 96;
const WIDTH = SIZE - MARGIN * 2;

function drawIcon(ctx: CanvasRenderingContext2D, paths: readonly string[], x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of paths) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/** Shrinks the font until the text fits in `width`, but never below `min`. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  size: number,
  min: number,
  width = WIDTH,
) {
  let current = size;
  ctx.font = font(current);
  while (ctx.measureText(text).width > width && current > min) {
    current -= 2;
    ctx.font = font(current);
  }
}

/**
 * Breaks text into lines that fit the page. Anything past `maxLines` is cut
 * with an ellipsis, so a long list of companies never runs off the image.
 */
export function wrapLines(text: string, maxWidth: number, maxLines: number, measure: (text: string) => number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (measure(next) <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === maxLines) {
      line = '';
      const last = lines.length - 1;
      let cut = lines[last];
      while (cut && measure(`${cut}…`) > maxWidth) cut = cut.slice(0, -1).trimEnd();
      lines[last] = `${cut.replace(/,$/, '')}…`;
      return lines;
    }
  }
  if (line) lines.push(line);
  // A single word wider than the page (a very long company name) gets cut too.
  return lines.map((text) => {
    let cut = text;
    if (measure(cut) <= maxWidth) return cut;
    while (cut && measure(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
    return `${cut}…`;
  });
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
  // Make sure the app's fonts are ready before drawing with them.
  try {
    await Promise.all([
      document.fonts.load(`500 76px ${SERIF}`),
      document.fonts.load(`500 34px ${SANS}`),
      document.fonts.load(`600 40px ${SERIF}`),
    ]);
  } catch {
    // Falls back to the system fonts.
  }

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not draw the image.');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.textBaseline = 'alphabetic';

  // The dated heading, then one fine line under it.
  ctx.fillStyle = INK;
  fitFont(ctx, title, (size) => `500 ${size}px ${SERIF}`, 76, 52);
  ctx.fillText(title, MARGIN, 170);
  ctx.fillStyle = MUTED;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(dateRange, MARGIN, 222);
  ctx.fillStyle = LINE;
  ctx.fillRect(MARGIN, 262, WIDTH, 2);

  // Numbers, two to a row, each with its label underneath.
  const shown = stats.slice(0, 4);
  const columns = shown.length > 1 ? 2 : 1;
  const gap = 48;
  const columnWidth = (WIDTH - gap * (columns - 1)) / columns;
  const rowHeight = 200;
  const top = 304;
  shown.forEach((stat, index) => {
    const x = MARGIN + (index % columns) * (columnWidth + gap);
    const y = top + Math.floor(index / columns) * rowHeight;
    ctx.fillStyle = INK;
    ctx.font = `500 136px ${SERIF}`;
    ctx.fillText(String(stat.value), x - 4, y + 112);
    ctx.fillStyle = MUTED;
    // Longer labels, like "days with goals complete", get a little smaller instead of being cut.
    fitFont(ctx, stat.label, (size) => `500 ${size}px ${SANS}`, 36, 28, columnWidth);
    const [label] = wrapLines(stat.label, columnWidth, 1, (text) => ctx.measureText(text).width);
    ctx.fillText(label, x, y + 160);
  });

  // The short rule that ends in Onward's mark.
  let y = top + Math.ceil(shown.length / columns) * rowHeight + 18;
  ctx.fillStyle = EVERGREEN;
  ctx.fillRect(MARGIN, y - 1.5, 140, 3);
  drawIcon(ctx, ONWARD_MARK_PATHS, MARGIN + 128, y - 30, 44, EVERGREEN);
  y += 80;

  if (streak > 0) {
    ctx.fillStyle = INK;
    ctx.font = `500 38px ${SANS}`;
    ctx.fillText(`${streak}-day streak`, MARGIN, y);
    y += 64;
  }

  if (companies.length > 0) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 32px ${SANS}`;
    // Up to three lines, always ending clear of the wordmark at the bottom.
    const room = Math.max(1, Math.min(3, Math.floor((920 - y) / 44) + 1));
    const lines = wrapLines(`Applied to ${companies.join(', ')}`, WIDTH, room, (text) => ctx.measureText(text).width);
    lines.forEach((line, index) => ctx.fillText(line, MARGIN, y + index * 44));
  }

  // The wordmark, like the app's header: the evergreen mark, then "Onward" in Spectral.
  const markY = SIZE - 76 - 44;
  drawIcon(ctx, ONWARD_MARK_PATHS, MARGIN - 4, markY - 2, 48, EVERGREEN);
  ctx.fillStyle = INK;
  ctx.font = `600 40px ${SERIF}`;
  ctx.fillText('Onward', MARGIN + 50, markY + 36);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png'),
  );
}
