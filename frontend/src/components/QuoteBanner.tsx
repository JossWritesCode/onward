import { todayIso } from '../lib/format';
import { useQuoteHidden, useQuotePick } from '../lib/preferences';
import { anotherQuoteIndex, QUOTES, quoteIndexForToday } from '../lib/quotes';
import { playSound } from '../lib/sounds';
import { ChevronDownIcon, ChevronUpIcon, QuoteIcon, ShuffleIcon } from './icons';

/**
 * Today's quote. Shuffling picks another one for the rest of the day, and
 * hiding it lasts until tomorrow's quote. Both animate, unless your device is
 * set to reduce motion.
 */
export default function QuoteBanner() {
  const today = todayIso();
  const [hidden, setHidden] = useQuoteHidden(today);
  const [pick, setPick] = useQuotePick(today);
  const index = pick ?? quoteIndexForToday();
  const quote = QUOTES[index];

  function shuffle() {
    setPick(anotherQuoteIndex(index));
    playSound('pop');
  }

  return (
    <>
      {/* Animating grid rows from 1fr to 0fr smoothly shrinks the banner to nothing. */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          hidden ? 'mb-0 grid-rows-[0fr] opacity-0' : 'mb-6 grid-rows-[1fr] opacity-100'
        }`}
        inert={hidden}
      >
        <div className="min-h-0 overflow-hidden">
          <figure className="relative overflow-hidden rounded-2xl border-2 border-b-4 border-brand-200 bg-brand-50 px-5 py-5 pr-20 sm:px-7 sm:pr-24 dark:border-brand-900 dark:bg-brand-950/50">
            <QuoteIcon
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -bottom-8 text-9xl text-brand-100 dark:text-brand-900/60"
            />
            <div key={index} className="animate-quote-in" aria-live="polite">
              <blockquote className="relative text-lg leading-snug font-extrabold text-brand-950 sm:text-xl dark:text-brand-50">
                {quote.text}
              </blockquote>
              <figcaption className="relative mt-2 text-sm text-brand-800 dark:text-brand-300">
                <span className="font-extrabold">{quote.author}</span>, {quote.source}
              </figcaption>
            </div>
            <div className="absolute top-3 right-3 flex gap-0.5">
              <button
                type="button"
                onClick={shuffle}
                aria-label="Show a different quote"
                title="Different quote"
                className="rounded-lg p-1.5 text-lg text-brand-400 transition hover:bg-brand-100 hover:text-brand-700 active:rotate-180 dark:hover:bg-brand-900 dark:hover:text-brand-200"
              >
                <ShuffleIcon />
              </button>
              <button
                type="button"
                onClick={() => setHidden(true)}
                aria-label="Hide today's quote"
                title="Hide until tomorrow"
                className="rounded-lg p-1.5 text-lg text-brand-400 hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-900 dark:hover:text-brand-200"
              >
                <ChevronUpIcon />
              </button>
            </div>
          </figure>
        </div>
      </div>

      {hidden && (
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="mb-6 inline-flex animate-quote-in items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
        >
          <QuoteIcon /> Show today's quote <ChevronDownIcon />
        </button>
      )}
    </>
  );
}
