import { useEffect, useRef, useState } from 'react';
import { onToast, type Toast } from '../lib/celebrate';
import { AlertIcon, CheckIcon, HeartIcon, StarIcon, XIcon } from './icons';

// Quiet cards on the notebook's paper. The tone shows in a small mark and a
// thin edge, never in a loud fill, and errors stay clearly apart in rose.
const TONE_STYLES = {
  celebrate: { card: 'border-line', mark: 'bg-tint text-tint-ink', icon: <CheckIcon /> },
  big: { card: 'border-gold-300 dark:border-gold-night', mark: 'bg-gold-100 text-gold-700 dark:bg-gold-night dark:text-gold-200', icon: <StarIcon /> },
  gentle: { card: 'border-line', mark: 'bg-plum text-plum-accent', icon: <HeartIcon /> },
  error: {
    card: 'border-rose-300 dark:border-rose-900',
    mark: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    icon: <AlertIcon />,
  },
};

function duration(toast: Toast) {
  // A toast with a button stays longer, so there's time to press it.
  if (toast.action) return 12000;
  return toast.tone === 'big' || toast.notes?.length ? 7000 : 4500;
}

/** Shows encouragement, and anything that went wrong, at the bottom of the screen. */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const pending = timers.current;
    const stop = onToast((toast) => {
      // The same id again means a note joined a toast, so it updates in place.
      setToasts((current) =>
        current.some((t) => t.id === toast.id)
          ? current.map((t) => (t.id === toast.id ? toast : t))
          : [...current.slice(-2), toast],
      );
      window.clearTimeout(pending.get(toast.id));
      pending.set(
        toast.id,
        window.setTimeout(() => {
          pending.delete(toast.id);
          setToasts((current) => current.filter((t) => t.id !== toast.id));
        }, duration(toast)),
      );
    });
    return () => {
      stop();
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function dismiss(id: number) {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const style = TONE_STYLES[toast.tone];
        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-md animate-toast-in items-start gap-3 rounded-xl border bg-surface p-4 shadow-lg shadow-stone-900/10 dark:shadow-black/40 ${style.card}`}
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-base ${style.mark}`}>
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{toast.title}</p>
              <p className="text-sm/5 text-muted">{toast.body}</p>
              {toast.notes?.map((note) => (
                <p key={note} className="mt-1.5 flex items-start gap-1.5 text-sm/5 font-semibold text-done">
                  <CheckIcon className="mt-0.5 shrink-0" /> {note}
                </p>
              ))}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="mt-2 rounded-lg bg-action px-3 py-1.5 text-sm font-semibold text-on-action transition hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
              className="rounded-lg p-1 text-muted hover:bg-stone-200/60 hover:text-ink dark:hover:bg-stone-800"
            >
              <XIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
