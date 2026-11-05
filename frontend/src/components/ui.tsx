import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghostDanger';

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition select-none ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

// The chunky "3D" look: a thick bottom border that squashes when pressed.
const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white border-b-4 border-brand-700 hover:bg-brand-600 ' +
    'active:translate-y-0.5 active:border-b-2 px-5 py-2.5',
  secondary:
    'bg-white text-brand-600 border-2 border-b-4 border-stone-200 hover:bg-brand-50 ' +
    'active:translate-y-0.5 active:border-b-2 px-5 py-2 ' +
    'dark:bg-stone-900 dark:text-brand-300 dark:border-stone-700 dark:hover:bg-stone-800',
  danger:
    'bg-rose-500 text-white border-b-4 border-rose-700 hover:bg-rose-600 ' +
    'active:translate-y-0.5 active:border-b-2 px-5 py-2.5',
  ghost:
    'text-stone-600 hover:bg-stone-200/60 px-3 py-2 dark:text-stone-300 dark:hover:bg-stone-800',
  ghostDanger:
    'text-rose-600 hover:bg-rose-50 px-3 py-2 dark:text-rose-400 dark:hover:bg-rose-950/40',
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

const fieldBase =
  'w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-800 ' +
  'placeholder:text-stone-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ' +
  'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-28 ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} pr-8 ${className}`} {...props} />;
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
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-stone-700 dark:text-stone-300">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      {error && <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border-2 border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function ErrorBanner({ messages }: { messages: readonly string[] }) {
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
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

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
        {icon}
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <p className="mt-1 max-w-sm text-stone-500 dark:text-stone-400">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
