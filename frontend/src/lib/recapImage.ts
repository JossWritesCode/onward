// Draws the weekly recap as a square image for sharing in group chats and
// social media. It looks like a page from a journal, the same as the recap on
// the Progress page: a dated heading, big numbers with their labels, and a
// short line that ends in Onward's rising arrow. Plain canvas drawing, so it
// needs no libraries.

export type RecapStat = { value: number; label: string };

const PAPER = '#F7F3EB';
const INK = '#241F1C';
const MUTED = '#625A50';
const LINE = '#D8D0C5';
const VIOLET = '#5B3BB5';
const FLAME = '#E8A317';

const SERIF = 'Spectral, Georgia, serif';
const SANS = '"DM Sans", system-ui, sans-serif';

// The same drawings as the app's icons (src/components/icons.tsx), on a 24 by 24 grid.
const ARROW = 'M7 17 17 7M9 7h8v8';
const FLAME_PATHS = [
  'M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2.1-5 3.6-7 .4 1.7 1.3 2.8 2.6 3.4C11.4 7.2 13 4.4 15.4 3c-.3 2.6.5 4.4 1.9 6 1.2 1.4 1.7 2.9 1.7 4.7C19 17.8 15.9 21 12 21Z',
  'M12 21c-1.7 0-3-1.3-3-3 0-1.9 1.6-2.8 2.3-4.4.9 1 2.2 1.6 2.9 2.8.5.8.8 1.4.8 2.1 0 1.4-1.3 2.5-3 2.5Z',
];

const SIZE = 1080;
const MARGIN = 96;
const WIDTH = SIZE - MARGIN * 2;

function drawIcon(ctx: CanvasRenderingContext2D, paths: string[], x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of paths) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/** Shrinks the font until the text fits on one line, but never below `min`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, min: number) {
  let current = size;
  ctx.font = font(current);
  while (ctx.measureText(text).width > WIDTH && current > min) {
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
      document.fonts.load(`600 34px ${SANS}`),
      document.fonts.load('900 40px Nunito'),
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
    ctx.font = `500 36px ${SANS}`;
    const [label] = wrapLines(stat.label, columnWidth, 1, (text) => ctx.measureText(text).width);
    ctx.fillText(label, x, y + 160);
  });

  // The short rule that ends in the rising arrow.
  let y = top + Math.ceil(shown.length / columns) * rowHeight + 6;
  ctx.fillStyle = VIOLET;
  ctx.fillRect(MARGIN, y - 2, 150, 4);
  drawIcon(ctx, [ARROW], MARGIN + 136, y - 25, 40, VIOLET);
  y += 80;

  if (streak > 0) {
    drawIcon(ctx, FLAME_PATHS, MARGIN - 4, y - 38, 48, FLAME);
    ctx.fillStyle = INK;
    ctx.font = `600 38px ${SANS}`;
    ctx.fillText(`${streak}-day streak`, MARGIN + 56, y);
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

  // Wordmark, like the app's header: the arrow in a violet square, then "Onward".
  const markY = SIZE - 76 - 44;
  ctx.fillStyle = VIOLET;
  ctx.beginPath();
  ctx.roundRect(MARGIN, markY, 44, 44, 12);
  ctx.fill();
  drawIcon(ctx, [ARROW], MARGIN + 7, markY + 7, 30, '#FFFFFF');
  ctx.font = '900 34px Nunito, sans-serif';
  ctx.fillText('Onward', MARGIN + 58, markY + 34);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png'),
  );
}
