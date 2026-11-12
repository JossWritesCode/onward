import { useEffect, useRef } from 'react';
import type { OpenedPdf } from '../../resume-pdf/pages';

/** The gap under a page for its "Page 1 of 2" label, in CSS pixels. */
export const PAGE_LABEL_HEIGHT = 22;

/**
 * The resume's pages, drawn one under another, each `width` CSS pixels wide.
 * When a new version or size arrives, each page is drawn offscreen and swapped
 * in once ready, so the preview never flashes blank while you type or zoom.
 */
export default function PdfPages({ pdf, working, width }: { pdf: OpenedPdf; working: boolean; width: number }) {
  return (
    <div
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
        // Fill the frame, so the drawing stretches with it until a sharper one is ready.
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        holder.current.replaceChildren(canvas);
      })
      .catch((caught: unknown) => console.error(caught));
    return () => {
      cancelled = true;
    };
  }, [pdf, number, width]);

  return (
    <figure className="m-0 shrink-0" style={{ width }} data-pdf-page={number}>
      <div
        ref={holder}
        className="overflow-hidden rounded-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25),0_6px_20px_rgba(0,0,0,0.12)]"
        style={{ width, height }}
      />
      {pdf.pages > 1 && (
        <figcaption className="mt-1.5 text-center text-xs leading-4 font-bold text-stone-500 dark:text-stone-400">
          Page {number} of {pdf.pages}
        </figcaption>
      )}
    </figure>
  );
}
