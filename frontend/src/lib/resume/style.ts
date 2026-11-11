import type { ResumeStyle, ResumeTemplate } from '../../gql/graphql';

// How a resume looks, apart from its template. The server keeps the values in
// range (backend/app/models/resume_style.rb); the ranges here are the same, so
// the sliders in the Design panel can't ask for something it would refuse.

export type StyleValues = Pick<ResumeStyle, 'fontSize' | 'lineHeight' | 'margin' | 'sectionGap' | 'accent'>;

export type Slider = {
  key: 'fontSize' | 'lineHeight' | 'margin' | 'sectionGap';
  label: string;
  min: number;
  max: number;
  step: number;
  /** How the value reads next to the slider. */
  format: (value: number) => string;
};

export const SLIDERS: readonly Slider[] = [
  { key: 'fontSize', label: 'Text size', min: 8.5, max: 11, step: 0.5, format: (v) => `${v} pt` },
  { key: 'lineHeight', label: 'Line spacing', min: 1.15, max: 1.6, step: 0.05, format: (v) => `${v.toFixed(2)}×` },
  { key: 'margin', label: 'Margins', min: 0.4, max: 1, step: 0.05, format: (v) => `${v.toFixed(2)}″` },
  { key: 'sectionGap', label: 'Space between sections', min: 4, max: 20, step: 1, format: (v) => `${v} pt` },
];

export const DEFAULT_ACCENT = '#4f46e5';

/** Just the five values, from whatever the API returned (it adds __typename). */
export function toStyleValues(style: StyleValues): StyleValues {
  return { fontSize: style.fontSize, lineHeight: style.lineHeight, margin: style.margin, sectionGap: style.sectionGap, accent: style.accent };
}

/** The Normal density: what a new resume gets. */
export const DEFAULT_STYLE: StyleValues = { fontSize: 9.5, lineHeight: 1.35, margin: 0.45, sectionGap: 11, accent: DEFAULT_ACCENT };

export type Density = 'roomy' | 'normal' | 'tight';

/** A density is just a shortcut that sets the four spacing values at once. */
export const DENSITIES: readonly { id: Density; label: string; hint: string; values: Omit<StyleValues, 'accent'> }[] = [
  { id: 'roomy', label: 'Roomy', hint: 'Easy on the eyes. For shorter resumes.', values: { fontSize: 10, lineHeight: 1.45, margin: 0.6, sectionGap: 14 } },
  { id: 'normal', label: 'Normal', hint: 'A good default.', values: { fontSize: 9.5, lineHeight: 1.35, margin: 0.45, sectionGap: 11 } },
  { id: 'tight', label: 'Tight', hint: 'Fits more on a page.', values: { fontSize: 9, lineHeight: 1.25, margin: 0.4, sectionGap: 8 } },
];

/** Which density the style matches, or null when it's been fine-tuned away from all of them. */
export function densityOf(style: StyleValues): Density | null {
  const match = DENSITIES.find((density) =>
    (Object.keys(density.values) as (keyof typeof density.values)[]).every((key) => Math.abs(style[key] - density.values[key]) < 0.001),
  );
  return match?.id ?? null;
}

/** Accent colours offered as swatches. Any hex colour can be typed too. */
export const ACCENTS: readonly { hex: string; name: string }[] = [
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#0f766e', name: 'Teal' },
  { hex: '#b45309', name: 'Amber' },
  { hex: '#be123c', name: 'Rose' },
  { hex: '#1d4ed8', name: 'Blue' },
  { hex: '#334155', name: 'Slate' },
];

export const TEMPLATE_DETAILS: readonly { id: ResumeTemplate; label: string; hint: string; usesAccent: boolean }[] = [
  { id: 'CLASSIC', label: 'Classic', hint: 'Centred serif name, thin rules. The traditional look.', usesAccent: false },
  { id: 'COMPACT', label: 'Compact', hint: 'Small sans-serif headings. Fits more on a page.', usesAccent: false },
  { id: 'MODERN', label: 'Modern', hint: 'Left-aligned, with an accent colour.', usesAccent: true },
];
