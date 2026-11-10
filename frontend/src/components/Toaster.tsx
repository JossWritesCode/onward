import { useEffect, useState } from 'react';
import { onToast, type Toast } from '../lib/celebrate';
import { HeartIcon, SparklesIcon, TrophyIcon, XIcon } from './icons';

const TONE_STYLES = {
  celebrate: 'border-brand-200 bg-white dark:border-brand-800 dark:bg-stone-900',
  big: 'border-gold-300 bg-gold-100 dark:border-amber-700 dark:bg-amber-950',
  gentle: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950',
};

const TONE_ICONS = {
  celebrate: { icon: <SparklesIcon />, style: 'bg-brand-500 text-white' },
  big: { icon: <TrophyIcon />, style: 'bg-gold-400 text-white' },
  gentle: { icon: <HeartIcon />, style: 'bg-rose-400 text-white' },
};

/** Shows celebration and encouragement messages at the bottom of the screen. */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      onToast((toast) => {
        setToasts((current) => [...current.slice(-2), toast]);
        // A toast with a button stays longer, so there's time to press it.
        const duration = toast.action ? 12000 : toast.tone === 'big' ? 7000 : 4500;
        setTimeout(() => setToasts((current) => current.filter((t) => t.id !== toast.id)), duration);
      }),
    [],
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-md animate-toast-in items-start gap-3 rounded-2xl border-2 border-b-4 p-4 ${TONE_STYLES[toast.tone]}`}
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xl ${TONE_ICONS[toast.tone].style}`}
          >
            {TONE_ICONS[toast.tone].icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-black">{toast.title}</p>
            <p className="text-stone-600 dark:text-stone-300">{toast.body}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToasts((current) => current.filter((t) => t.id !== toast.id));
                }}
                className="mt-2 rounded-xl border-2 border-b-4 border-brand-700 bg-brand-500 px-3 py-1.5 text-sm font-extrabold text-white transition hover:bg-brand-600 active:translate-y-0.5 active:border-b-2"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
