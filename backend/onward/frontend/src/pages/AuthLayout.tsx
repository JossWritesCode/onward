import type { ReactNode } from 'react';
import Logo from '../components/Logo';
import { Card } from '../components/ui';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-1 mb-6 text-stone-500 dark:text-stone-400">{subtitle}</p>
        {children}
      </Card>
      <p className="mt-6 text-stone-600 dark:text-stone-400">{footer}</p>
    </div>
  );
}
