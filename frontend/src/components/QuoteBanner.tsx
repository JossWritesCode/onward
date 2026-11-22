import { todayIso } from '../lib/format';
import { useQuoteHidden, useQuotePick } from '../lib/preferences';
import { anotherQuoteIndex, QUOTES, quoteIndexForToday } from '../lib/quotes';
import { ChevronDownIcon, ChevronUpIcon, QuoteIcon, ShuffleIcon } from './icons';

const quietButton =
  'rounded-lg p-1.5 text-base text-muted transition hover:bg-plum hover:text-plum-ink ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';

/**
 * Today's quote, written small in the margin under the page heading, so your
 * applications are only a glance away. Shuffling picks another one for the
 * rest of the day, and hiding it lasts until tomorrow's quote.
 */
export default function QuoteBanner() {
  const today = todayIso();
  const [hidden, setHidden] = useQuoteHidden(today);
  const [pick, setPick] = useQuotePick(today);
  const index = pick ?? quoteIndexForToday();
  const quote = QUOTES[index];

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="-ml-2 mb-5 inline-flex animate-quote-in items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:bg-plum hover:text-plum-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <QuoteIcon className="text-plum-accent" /> Show today's quote <ChevronDownIcon />
      </button>
    );
  }

  return (
    // A thin plum rule on the left, like a note in the margin of a notebook.
    // It gets room above and below so it reads as its own moment, with less on
    // a phone so the board isn't pushed too far down. The text stops at about
    // 68 characters, a comfortable line length, and the buttons keep a small
    // gutter of their own instead of crowding the end of the first line.
    <figure className="my-4 flex max-w-3xl items-start gap-3 border-l-2 border-plum-accent/60 py-0.5 pl-3.5 sm:my-7 sm:gap-6">
      <div key={index} className="min-w-0 flex-1 animate-quote-in" aria-live="polite">
        <blockquote className="max-w-[68ch] font-quote text-base/6 text-pretty text-ink italic sm:text-[17px]/[26px]">
          {quote.text}
        </blockquote>
        <figcaption className="mt-1.5 text-[13px]/[18px] text-muted sm:mt-2">
          <span className="font-semibold text-plum-accent">{quote.author}</span>, {quote.source}
        </figcaption>
      </div>
      <div className="-mt-1 flex shrink-0 gap-0.5">
        <button
          type="button"
          onClick={() => setPick(anotherQuoteIndex(index))}
          aria-label="Show a different quote"
          title="Different quote"
          className={quietButton}
        >
          <ShuffleIcon />
        </button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Hide today's quote"
          title="Hide until tomorrow"
          className={quietButton}
        >
          <ChevronUpIcon />
        </button>
      </div>
    </figure>
  );
}
