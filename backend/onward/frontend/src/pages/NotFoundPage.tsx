import Logo from '../components/Logo';
import { ButtonLink } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo size="lg" />
      <div>
        <h1 className="text-3xl font-black">This page took a wrong turn</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">The page you're looking for doesn't exist.</p>
      </div>
      <ButtonLink to="/applications">Back to your applications</ButtonLink>
    </div>
  );
}
