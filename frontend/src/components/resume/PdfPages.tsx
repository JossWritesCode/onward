import { useEffect, useRef, useState } from 'react';
import type { OpenedPdf } from '../../resume-pdf/pages';

/**
 * The resume's pages, drawn one under another. When a new version arrives,
 * each page is drawn offscreen and swapped in once ready, so the preview
 * never flashes blank while you type.
 */
export default function PdfPages({ pdf, working }: { pdf: OpenedPdf; working: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Fit the page to the column, and follow the column if it changes size.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const update = () => setWidth(Math.floor(element.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={container}
      className={`flex flex-col items-center gap-4 transition-opacity ${working ? 'opacity-70' : ''}`}
      aria-busy={working}
    >
      {width > 0 &&
        Array.from({ length: pdf.pages }, (_, index) => (
          <PdfPage key={index} pdf={pdf} number={index + 1} width={width} />
        ))}
    </div>
  );
}

function PdfPage({ pdf, number, width }: { pdf: OpenedPdf; number: number; width: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const height = Math.floor((width * pdf.pageSize.height) / pdf.pageSize.width);

  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement('canvas');
    canvas.className = 'block';
    pdf
      .draw(number, canvas, width)
      .then(() => {
        if (cancelled || !holder.current) return;
        holder.current.replaceChildren(canvas);
      })
      .catch((caught: unknown) => console.error(caught));
    return () => {
      cancelled = true;
    };
  }, [pdf, number, width]);

  return (
    <figure className="m-0" style={{ width }}>
      <div
        ref={holder}
        className="overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25),0_6px_20px_rgba(0,0,0,0.12)]"
        style={{ width, height }}
      />
      {pdf.pages > 1 && (
        <figcaption className="mt-1.5 text-center text-xs font-bold text-stone-500 dark:text-stone-400">
          Page {number} of {pdf.pages}
        </figcaption>
      )}
    </figure>
  );
}
