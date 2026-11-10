import { useEffect, useState } from 'react';

/**
 * Shows a PDF in the browser's own viewer. When a new version arrives it
 * loads behind the old one and swaps in once it's ready, so the preview
 * doesn't flash white while you type.
 */
export default function PdfFrame({ url, title }: { url: string; title: string }) {
  const [shown, setShown] = useState(url);

  // If the browser never reports the new one as loaded, show it anyway.
  useEffect(() => {
    if (url === shown) return;
    const timer = setTimeout(() => setShown(url), 1500);
    return () => clearTimeout(timer);
  }, [url, shown]);

  const frames = url === shown ? [shown] : [shown, url];
  return (
    <div className="relative size-full overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
      {frames.map((frame) => (
        <iframe
          key={frame}
          title={frame === shown ? title : undefined}
          aria-hidden={frame === shown ? undefined : true}
          tabIndex={frame === shown ? undefined : -1}
          src={`${frame}#toolbar=0&navpanes=0&view=FitH`}
          onLoad={frame === shown ? undefined : () => setShown(frame)}
          className="absolute inset-0 size-full border-0"
          style={{ opacity: frame === shown ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
