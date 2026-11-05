import type { ReactNode } from 'react';

type Option = { id: string; label: string; detail?: string | null };

/** A list of checkboxes for linking contacts to applications (or the other way around). */
export default function LinkPicker({
  legend,
  options,
  selected,
  onChange,
  empty,
}: {
  legend: string;
  options: readonly Option[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  empty: ReactNode;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-bold text-stone-700 dark:text-stone-300">{legend}</legend>
      {options.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 px-4 py-3 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          {empty}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30 ${
                  checked
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'border-stone-200 text-stone-600 hover:border-brand-300 dark:border-stone-700 dark:text-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(option.id)}
                />
                <span aria-hidden="true">{checked ? '✓' : '+'}</span>
                {option.label}
                {option.detail && <span className="font-normal text-stone-400">{option.detail}</span>}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
