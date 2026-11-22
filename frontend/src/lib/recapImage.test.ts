import { describe, expect, it } from 'vitest';
import { wrapLines } from './recapImage';

// One unit per character keeps the widths easy to reason about.
const measure = (text: string) => text.length;

describe('wrapLines', () => {
  it('keeps short text on one line', () => {
    expect(wrapLines('Applied to Brightline', 40, 3, measure)).toEqual(['Applied to Brightline']);
  });

  it('breaks between words', () => {
    expect(wrapLines('Applied to Brightline, Copperleaf', 22, 3, measure)).toEqual([
      'Applied to Brightline,',
      'Copperleaf',
    ]);
  });

  it('cuts with an ellipsis when there are more lines than room', () => {
    const lines = wrapLines('one two three four five six seven', 9, 2, measure);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(9);
  });

  it('cuts a single word that is wider than the page', () => {
    const [line] = wrapLines('Supercalifragilistic', 10, 1, measure);
    expect(line).toBe('Supercali…');
  });
});
