import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { PlusIcon } from './icons';
import { Button, Input } from './ui';

type Option = { id: string; label: string; detail?: string | null };

/**
 * A list of toggles for linking contacts to applications (or the other way
 * around). With onCreate, it can also add a new contact on the spot.
 */
export default function LinkPicker({
  legend,
  options,
  selected,
  onChange,
  onCreate,
  empty,
}: {
  legend: string;
  options: readonly Option[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  onCreate?: (name: string, title: string) => Promise<void>;
  empty: ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  async function create() {
    if (!onCreate) return;
    if (!name.trim()) {
      setError('Enter a name first.');
      return;
    }
    setSaving(true);
    try {
      await onCreate(name.trim(), title);
      setName('');
      setTitle('');
      setError(null);
      setAdding(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't add that contact.");
    } finally {
      setSaving(false);
    }
  }

  // This sits inside the application form, so Enter adds the contact instead of submitting the form.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void create();
    } else if (event.key === 'Escape') {
      setAdding(false);
    }
  }

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-bold text-stone-700 dark:text-stone-300">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.length === 0 && !onCreate && (
          <div className="w-full rounded-xl border-2 border-dashed border-stone-200 px-4 py-3 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            {empty}
          </div>
        )}
        {options.length === 0 && onCreate && !adding && (
          <p className="w-full text-sm text-stone-500 dark:text-stone-400">{empty}</p>
        )}
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
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(option.id)} />
              <span aria-hidden="true">{checked ? '✓' : '+'}</span>
              {option.label}
              {option.detail && <span className="font-normal text-stone-400">{option.detail}</span>}
            </label>
          );
        })}
        {onCreate && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-stone-300 px-3 py-1.5 text-sm font-bold text-brand-600 transition hover:border-brand-400 hover:bg-brand-50 dark:border-stone-700 dark:text-brand-300 dark:hover:bg-brand-950/40"
          >
            <PlusIcon /> New contact
          </button>
        )}
      </div>

      {onCreate && adding && (
        <div className="mt-3 rounded-xl border-2 border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/30">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <label className="sr-only" htmlFor="new-contact-name">
              Contact name
            </label>
            <Input
              id="new-contact-name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Name"
            />
            <label className="sr-only" htmlFor="new-contact-title">
              Title (optional)
            </label>
            <Input
              id="new-contact-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Title (optional)"
            />
            <div className="flex gap-2">
              <Button className="flex-1 px-4 py-2" onClick={create} disabled={saving}>
                {saving ? 'Adding…' : 'Add'}
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            You can add more details later on the Contacts page.
          </p>
        </div>
      )}
    </fieldset>
  );
}
