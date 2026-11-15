import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, pageWidth, stepZoom, zoomPercent } from './zoom';

const LETTER = { width: 612, height: 792 }; // points
const A4 = { width: 595.28, height: 841.89 };
const LETTER_PX = 612 * (96 / 72); // 816 CSS pixels at 100%

describe('pageWidth at Fit page', () => {
  it('is limited by the width in a tall, narrow panel', () => {
    // 600 wide x 2000 tall: the width is the limit.
    expect(pageWidth('page', { width: 600, height: 2000 }, LETTER, 0)).toBe(600);
  });

  it('fits the height in a short, wide panel', () => {
    const width = pageWidth('page', { width: 640, height: 588 }, LETTER, 0);
    expect(width).toBe(Math.floor((588 * 612) / 792)); // 454
    expect((width * 792) / 612).toBeLessThanOrEqual(588);
  });

  it('leaves room for the "Page 1 of 2" label', () => {
    const withLabel = pageWidth('page', { width: 640, height: 588 }, LETTER, 22);
    expect((withLabel * 792) / 612 + 22).toBeLessThanOrEqual(588);
    expect(withLabel).toBeLessThan(pageWidth('page', { width: 640, height: 588 }, LETTER, 0));
  });

  it('fits a taller A4 page smaller than Letter in the same panel', () => {
    const room = { width: 640, height: 588 };
    expect(pageWidth('page', room, A4, 0)).toBeLessThan(pageWidth('page', room, LETTER, 0));
  });

  it('never draws a page narrower than 80 pixels', () => {
    expect(pageWidth('page', { width: 500, height: 30 }, LETTER, 22)).toBe(80);
  });
});

describe('pageWidth at other zooms', () => {
  it('Fit width fills the panel', () => {
    expect(pageWidth('width', { width: 640, height: 100 }, LETTER, 22)).toBe(640);
  });

  it('100% is the real size of the page', () => {
    expect(pageWidth(100, { width: 300, height: 300 }, LETTER, 0)).toBe(LETTER_PX);
    expect(pageWidth(50, { width: 300, height: 300 }, LETTER, 0)).toBe(LETTER_PX / 2);
  });

  it('is 0 until the panel has a size', () => {
    expect(pageWidth('page', { width: 0, height: 0 }, LETTER, 0)).toBe(0);
  });
});

describe('zoomPercent', () => {
  it('reads the width back as a percentage', () => {
    expect(zoomPercent(LETTER_PX, LETTER)).toBe(100);
    expect(zoomPercent(454, LETTER)).toBe(56);
  });

  it('is 100 before anything is drawn', () => {
    expect(zoomPercent(0, LETTER)).toBe(100);
  });
});

describe('stepZoom', () => {
  it('steps from a fit to the next round number, not 10 past it', () => {
    expect(stepZoom(55.6, 1)).toBe(60);
    expect(stepZoom(55.6, -1)).toBe(50);
  });

  it('moves a full step from a round number', () => {
    expect(stepZoom(60, 1)).toBe(70);
    expect(stepZoom(60, -1)).toBe(50);
  });

  it('handles floating-point values that are a hair off a round number', () => {
    expect(stepZoom(70.0000001, 1)).toBe(80);
    expect(stepZoom(69.9999999, -1)).toBe(60);
  });

  it('stops at the limits', () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(295, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
    expect(stepZoom(28, -1)).toBe(MIN_ZOOM);
  });
});
