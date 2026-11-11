import type { StyleValues } from '../lib/resume/style';

/**
 * The numbers a template draws with, worked out from the resume's style
 * settings. Templates read these rather than hard-coding sizes, so the
 * Design panel's sliders move every template the same way.
 */
export type Theme = {
  /** Body text size, in points. */
  body: number;
  /** Line height for body text, as a multiple. */
  lineHeight: number;
  /** Sizes that scale with the body text. */
  name: number;
  heading: number;
  small: number;
  /** Page padding, in points. */
  margin: number;
  /** Space above a section heading, in points. */
  sectionGap: number;
  /** Space between entries (jobs, schools), and between bullets. */
  entryGap: number;
  bulletGap: number;
  accent: string;
};

export function buildTheme(style: StyleValues): Theme {
  const body = style.fontSize;
  return {
    body,
    lineHeight: style.lineHeight,
    name: Math.round(body * 2.8),
    heading: Math.round(body * 1.35 * 2) / 2,
    small: Math.round(body * 0.92 * 2) / 2,
    margin: Math.round(style.margin * 72),
    sectionGap: style.sectionGap,
    entryGap: Math.round(style.sectionGap * 0.7 * 2) / 2,
    bulletGap: Math.round(body * (style.lineHeight - 1) * 0.8 * 2) / 2,
    accent: style.accent,
  };
}

// react-pdf works out line height from the font size in the *same* style, not
// an inherited one, so every text style sets both together.
export const type = (fontSize: number, lineHeight: number) => ({ fontSize, lineHeight });

export const INK = '#1f1f1f';
export const GREY = '#4d4d4d';
export const RULE = '#a3a3a3';

/** " | " with a little more air. The no-break spaces keep the bar with the text before it when a line wraps. */
export const SEPARATOR = '  |  ';
