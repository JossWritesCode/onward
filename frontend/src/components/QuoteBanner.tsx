import { todayIso } from '../lib/format';
import { useQuoteHidden } from '../lib/preferences';
import { quoteForToday } from '../lib/quotes';
import { ChevronDownIcon, ChevronUpIcon, QuoteIcon } from './icons';

/** Today's quote. Collapsing it lasts until tomorrow's quote. */
export default function QuoteBanner() {
  const today = todayIso();
  const [hidden, setHidden] = useQuoteHidden(today);
  const quote = quoteForToday();

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
      >
        <QuoteIcon /> Show today's quote <ChevronDownIcon />
      </button>
    );
  }

  return (
    <figure className="relative mb-6 overflow-hidden rounded-2xl border-2 border-b-4 border-brand-200 bg-brand-50 px-5 py-5 pr-12 sm:px-7 dark:border-brand-900 dark:bg-brand-950/50">
      <QuoteIcon
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -bottom-8 text-9xl text-brand-100 dark:text-brand-900/60"
      />
      <blockquote className="relative text-lg leading-snug font-extrabold text-brand-950 sm:text-xl dark:text-brand-50">
        {quote.text}
      </blockquote>
      <figcaption className="relative mt-2 text-sm text-brand-800 dark:text-brand-300">
        <span className="font-extrabold">{quote.author}</span>, {quote.source}
      </figcaption>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide today's quote"
        title="Hide until tomorrow"
        className="absolute top-3 right-3 rounded-lg p-1.5 text-lg text-brand-400 hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-900 dark:hover:text-brand-200"
      >
        <ChevronUpIcon />
      </button>
    </figure>
  );
}
