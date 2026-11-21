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
          <figure className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3.5 sm:gap-4 sm:px-5 dark:border-transparent dark:bg-plum-900">
            {/* One small quotation mark on the left, away from the buttons on the right. */}
            <QuoteIcon aria-hidden="true" className="mt-1 shrink-0 text-xl text-brand-300 sm:text-2xl dark:text-brand-400/70" />
            {/* The buttons float, so long quotes wrap underneath them instead of leaving an empty strip. */}
            <div className="min-w-0 flex-1">
              <div className="float-right -mt-1.5 -mr-1.5 ml-3 flex gap-0.5">
                <button
                  type="button"
                  onClick={shuffle}
                  aria-label="Show a different quote"
                  title="Different quote"
                  className="rounded-lg p-1.5 text-lg text-stone-400 transition hover:bg-brand-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:rotate-180 dark:text-night-300 dark:hover:bg-brand-tint dark:hover:text-brand-250"
                >
                  <ShuffleIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setHidden(true)}
                  aria-label="Hide today's quote"
                  title="Hide until tomorrow"
                  className="rounded-lg p-1.5 text-lg text-stone-400 transition hover:bg-brand-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 dark:text-night-300 dark:hover:bg-brand-tint dark:hover:text-brand-250"
                >
                  <ChevronUpIcon />
                </button>
              </div>
              <div key={index} className="animate-quote-in" aria-live="polite">
                <blockquote className="font-quote text-lg/7 text-pretty text-stone-800 sm:text-xl/7 dark:text-night-50">
                  {quote.text}
                </blockquote>
                <figcaption className="mt-1 text-sm text-stone-500 dark:text-night-300">
                  <span className="font-semibold">{quote.author}</span>, {quote.source}
                </figcaption>
              </div>
            </div>
          </figure>
        </div>
      </div>

      {hidden && (
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="mb-6 inline-flex animate-quote-in items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-brand-600 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 dark:text-brand-250 dark:hover:bg-brand-tint"
        >
          <QuoteIcon /> Show today's quote <ChevronDownIcon />
        </button>
      )}
    </>
  );
}
