import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghostDanger' | 'hero' | 'outline';

const base =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm/5 font-semibold transition select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

// Flat buttons. One filled violet action per area, with quieter ones beside it.
const filled = 'bg-action text-white hover:bg-action-hover px-4 py-2.5';
const variants: Record<Variant, string> = {
  primary: filled,
  secondary:
    'bg-surface text-link border border-control hover:bg-stone-100 px-4 py-2 dark:hover:bg-stone-800',
  danger: 'bg-rose-700 text-white hover:bg-rose-800 px-4 py-2.5 dark:bg-rose-600 dark:hover:bg-rose-500',
  ghost: 'text-muted hover:bg-stone-200/60 hover:text-ink px-3 py-2 dark:hover:bg-stone-800',
  ghostDanger:
    'text-rose-700 hover:bg-rose-50 px-3 py-2 dark:text-rose-400 dark:hover:bg-rose-950/40',
  // The board's main action. It's the same as primary now; the name stays for its callers.
  hero: filled,
  // A lighter action that sits next to a filled button without competing with it.
  outline:
    'bg-transparent text-link border border-line hover:border-control hover:bg-surface px-4 py-2',
};

export function buttonClasses(variant: Variant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}

// Fields get a firmer edge than the decorative lines around them, so they're easy to find.
const fieldBase =
  'w-full rounded-lg border border-control bg-surface px-3 py-2 text-base text-ink ' +
  'placeholder:text-stone-400 transition focus:border-link focus:outline-none focus:ring-3 focus:ring-link/20 ' +
  'dark:placeholder:text-stone-500';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-28 ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} pr-10 ${className}`} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm/5 font-semibold text-ink">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[13px]/[18px] text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function ErrorBanner({ messages }: { messages: readonly string[] }) {
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
    >
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex justify-center py-16" role="status">
      <span className="size-9 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * A short, left-aligned note for a page with nothing on it yet. Pass a small
 * icon, or a little drawing of your own with `illustration`.
 */
export function EmptyState({
  icon,
  illustration,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  illustration?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 py-6">
      {illustration ?? (icon && <span className="text-3xl text-muted">{icon}</span>)}
      <div>
        <h2 className="text-[22px]/7 font-semibold">{title}</h2>
        <p className="mt-2 text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  titleClassName = 'text-[32px]/[36px] font-semibold sm:text-[40px]/[44px]',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className={`tracking-[-0.01em] ${titleClassName}`}>{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
