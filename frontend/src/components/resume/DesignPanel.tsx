import { useId, useState } from 'react';
import type { ResumeTemplate } from '../../gql/graphql';
import {
  ACCENTS,
  DENSITIES,
  SLIDERS,
  TEMPLATE_DETAILS,
  densityOf,
  type Density,
  type StyleValues,
} from '../../lib/resume/style';
import { ChevronDownIcon } from '../icons';

type Props = {
  template: ResumeTemplate;
  style: StyleValues;
  onChange: (change: { template?: ResumeTemplate; style?: StyleValues }) => void;
};

const choice =
  'flex-1 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';
const chosen = 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-100';
const unchosen =
  'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600';

/**
 * How the resume looks: template, density, fine-tuning, and (for Modern) the
 * accent colour. Every change shows in the preview right away and is saved
 * with the rest of the resume.
 */
export default function DesignPanel({ template, style, onChange }: Props) {
  const id = useId();
  const density = densityOf(style);
  const [tuning, setTuning] = useState(density === null);
  const usesAccent = TEMPLATE_DETAILS.find((candidate) => candidate.id === template)?.usesAccent ?? false;

  const setDensity = (next: Density) => {
    const values = DENSITIES.find((candidate) => candidate.id === next)?.values;
    if (values) onChange({ style: { ...style, ...values } });
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">Template</legend>
        <div className="flex flex-col gap-2 sm:flex-row" role="radiogroup">
          {TEMPLATE_DETAILS.map((candidate) => {
            const active = candidate.id === template;
            return (
              <button
                key={candidate.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ template: candidate.id })}
                className={`${choice} ${active ? chosen : unchosen}`}
              >
                <span className="block font-extrabold">{candidate.label}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">{candidate.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">
          Density
          {density === null && <span className="ml-2 font-semibold text-stone-500 dark:text-stone-400">Custom</span>}
        </legend>
        <div className="flex gap-2" role="radiogroup">
          {DENSITIES.map((candidate) => {
            const active = candidate.id === density;
            return (
              <button
                key={candidate.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={candidate.hint}
                onClick={() => setDensity(candidate.id)}
                className={`${choice} text-center font-extrabold ${active ? chosen : unchosen}`}
              >
                {candidate.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          aria-expanded={tuning}
          aria-controls={`${id}-tuning`}
          onClick={() => setTuning((open) => !open)}
          className="inline-flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-brand-600 dark:text-stone-300 dark:hover:text-brand-300"
        >
          <ChevronDownIcon className={`transition-transform ${tuning ? '' : '-rotate-90'}`} />
          Fine-tune
        </button>
        {tuning && (
          <div id={`${id}-tuning`} className="mt-2 grid gap-3 sm:grid-cols-2">
            {SLIDERS.map((slider) => {
              const inputId = `${id}-${slider.key}`;
              const value = style[slider.key];
              return (
                <div key={slider.key}>
                  <div className="mb-0.5 flex items-baseline justify-between text-sm">
                    <label htmlFor={inputId} className="font-bold text-stone-700 dark:text-stone-300">
                      {slider.label}
                    </label>
                    <output htmlFor={inputId} className="tabular-nums text-stone-500 dark:text-stone-400">
                      {slider.format(value)}
                    </output>
                  </div>
                  <input
                    id={inputId}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(event) => onChange({ style: { ...style, [slider.key]: Number(event.target.value) } })}
                    className="w-full accent-brand-600"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {usesAccent && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">Accent colour</legend>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((accent) => {
              const active = accent.hex === style.accent.toLowerCase();
              return (
                <button
                  key={accent.hex}
                  type="button"
                  title={accent.name}
                  aria-label={accent.name}
                  aria-pressed={active}
                  onClick={() => onChange({ style: { ...style, accent: accent.hex } })}
                  className={`size-8 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ${
                    active ? 'scale-110 border-stone-900 dark:border-white' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: accent.hex }}
                />
              );
            })}
            <label className="ml-1 inline-flex items-center gap-1.5 text-sm font-bold text-stone-600 dark:text-stone-300">
              <input
                type="color"
                value={style.accent}
                onChange={(event) => onChange({ style: { ...style, accent: event.target.value } })}
                aria-label="Custom accent colour"
                className="size-8 cursor-pointer rounded-lg border-2 border-stone-200 bg-transparent p-0.5 dark:border-stone-700"
              />
              Custom
            </label>
          </div>
        </fieldset>
      )}
    </div>
  );
}
