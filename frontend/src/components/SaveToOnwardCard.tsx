import { useEffect, useRef, useState } from 'react';
import { bookmarkletHref } from '../lib/bookmarklet';
import { BookmarkIcon } from './icons';
import { Card } from './ui';

/** The "Save to Onward" bookmark, ready to drag to the bookmarks bar. */
export default function SaveToOnwardCard() {
  const link = useRef<HTMLAnchorElement>(null);
  const [clicked, setClicked] = useState(false);

  // React won't render javascript: links, so the address is set directly.
  useEffect(() => {
    link.current?.setAttribute('href', bookmarkletHref(window.location.origin));
  }, []);

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <BookmarkIcon className="text-brand-500" /> Save jobs from LinkedIn and Indeed
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
        Drag this button to your browser's bookmarks bar. Then, on any job posting, click it and Onward opens with the
        job filled in, ready for you to check and save.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          ref={link}
          onClick={(event) => {
            event.preventDefault();
            setClicked(true);
          }}
          className="inline-flex cursor-grab items-center gap-2 rounded-2xl border-b-4 border-brand-700 bg-brand-500 px-5 py-2.5 font-extrabold text-white shadow-sm active:cursor-grabbing"
          title="Drag me to your bookmarks bar"
        >
          <BookmarkIcon /> Save to Onward
        </a>
        <span className="text-sm font-bold text-stone-500 dark:text-stone-400">← drag to your bookmarks bar</span>
      </div>

      {clicked && (
        <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
          Drag it instead of clicking: hold the button, move it up to your bookmarks bar, and let go.
        </p>
      )}

      <details className="mt-4 text-sm text-stone-600 dark:text-stone-300">
        <summary className="font-bold text-stone-700 dark:text-stone-200">Don't see a bookmarks bar?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Chrome or Edge:</strong> press <kbd>⌘</kbd> <kbd>Shift</kbd> <kbd>B</kbd> on a Mac, or{' '}
            <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>B</kbd> on Windows.
          </li>
          <li>
            <strong>Safari:</strong> View → Show Favorites Bar.
          </li>
          <li>
            <strong>Firefox:</strong> View → Toolbars → Bookmarks Toolbar.
          </li>
        </ul>
        <p className="mt-2">
          Works on LinkedIn, Indeed, and most company career pages. It reads the job in your own browser, so nothing
          about the page goes anywhere except into your new Onward tab, and nothing is saved until you click Save. On
          sites it doesn't know, it fills in what it can find.
        </p>
      </details>
    </Card>
  );
}
