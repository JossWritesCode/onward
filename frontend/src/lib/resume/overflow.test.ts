import { describe, expect, it } from 'vitest';
import { overflowMessage } from './overflow';

describe('overflowMessage', () => {
  it.each([
    [0.05, 'Only a few lines spill onto page 2: one trimmed bullet, or a tighter density, should do it.'],
    [0.2, 'Page 2 is about a quarter full.'],
    [0.5, 'Page 2 is about half full.'],
    [0.75, 'Page 2 is about three-quarters full.'],
    [0.95, 'Page 2 is nearly full.'],
  ])('a last page %f full says "%s"', (fill, how) => {
    expect(overflowMessage(2, fill)).toBe(`This runs onto 2 pages. ${how}`);
  });

  it('switches wording exactly at each boundary', () => {
    expect(overflowMessage(2, 0.14)).toContain('about a quarter');
    expect(overflowMessage(2, 0.35)).toContain('about half');
    expect(overflowMessage(2, 0.62)).toContain('three-quarters');
    expect(overflowMessage(2, 0.88)).toContain('nearly full');
  });

  it('names the right last page for longer resumes', () => {
    expect(overflowMessage(3, 0.5)).toBe('This runs onto 3 pages. Page 3 is about half full.');
  });
});
