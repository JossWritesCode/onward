import { describe, expect, it } from 'vitest';
import { applyScheme, parseTheme, resolveScheme } from './theme';

describe('parseTheme', () => {
  it('keeps a choice you made', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('system')).toBe('system');
  });

  it('follows the system when nothing is saved or storage is blocked', () => {
    expect(parseTheme(null)).toBe('system');
    expect(parseTheme(undefined)).toBe('system');
  });

  it('follows the system when the saved value is something else', () => {
    expect(parseTheme('')).toBe('system');
    expect(parseTheme('Dark')).toBe('system');
    expect(parseTheme('true')).toBe('system');
  });
});

describe('resolveScheme', () => {
  it('uses the system setting for "system"', () => {
    expect(resolveScheme('system', true)).toBe('dark');
    expect(resolveScheme('system', false)).toBe('light');
  });

  it('ignores the system setting once you pick', () => {
    expect(resolveScheme('light', true)).toBe('light');
    expect(resolveScheme('dark', false)).toBe('dark');
  });
});

describe('applyScheme', () => {
  it('marks the page for Tailwind and for the browser', () => {
    const root = { dataset: {} as DOMStringMap, style: {} as CSSStyleDeclaration } as HTMLElement;
    applyScheme('dark', root);
    expect(root.dataset.theme).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
    applyScheme('light', root);
    expect(root.dataset.theme).toBe('light');
    expect(root.style.colorScheme).toBe('light');
  });
});
