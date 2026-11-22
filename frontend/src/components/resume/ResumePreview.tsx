import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { OpenedPdf } from '../../resume-pdf/pages';
import { ExpandIcon, MinusIcon, PlusIcon, XIcon } from '../icons';
import { Spinner } from '../ui';
import { MAX_ZOOM, MIN_ZOOM, POINTS_TO_PIXELS, pageWidth, stepZoom, zoomPercent, type Zoom } from '../../lib/resume/zoom';
import PdfPages, { PAGE_LABEL_HEIGHT } from './PdfPages';

/** The grey space around the pages (p-4), on each side. */
const PADDING = 16;

type Props = {
  /** The PDF to show, or null while the first one is being made. */
  pdf: OpenedPdf | null;
  working: boolean;
  /** False when there's nothing to wait for, like after an error. */
  loading: boolean;
  /**
   * 'panel' fills the height it's given and can zoom. 'flow' is as tall as
   * its pages at the full width, for phones, where the page itself scrolls.
   */
  layout: 'panel' | 'flow';
  className?: string;
};

/** The resume preview: stacked pages with a zoom control, and an Expand button that opens it over the whole window. */
export default function ResumePreview({ pdf, working, loading, layout, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef<HTMLButtonElement>(null);

  function close() {
    setExpanded(false);
    expandButton.current?.focus();
  }

  return (
    <>
      <PreviewPane
        pdf={pdf}
        working={working}
        loading={loading}
        zoomable={layout === 'panel'}
        fill={layout === 'panel'}
        className={className}
        action={
          <button
            ref={expandButton}
            type="button"
            onClick={() => setExpanded(true)}
            className={`${toolButton} ml-auto`}
            aria-haspopup="dialog"
          >
            <ExpandIcon /> Expand
          </button>
        }
      />
      {expanded && <PreviewOverlay pdf={pdf} working={working} loading={loading} onClose={close} />}
    </>
  );
}

const toolButton =
  'inline-flex items-center gap-1.5 rounded-lg border-2 px-2 py-1 text-sm font-extrabold transition ' +
  'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900 ' +
  'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-100 ' +
  'disabled:opacity-40 disabled:hover:border-stone-200 dark:disabled:hover:border-stone-700 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';
const toolButtonOn =
  'border-brand-500! bg-brand-50! text-brand-800! dark:bg-brand-950/60! dark:text-brand-100!';

function PreviewPane({
  pdf,
  working,
  loading,
  zoomable,
  fill,
  action,
  className = '',
}: {
  pdf: OpenedPdf | null;
  working: boolean;
  loading: boolean;
  zoomable: boolean;
  fill: boolean;
  action: ReactNode;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<Zoom>(zoomable ? 'page' : 'width');

  // Follow the panel as it changes size.
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () =>
      setRoom({
        width: Math.max(0, Math.floor(element.clientWidth) - PADDING * 2),
        height: Math.max(0, Math.floor(element.clientHeight) - PADDING * 2),
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const mode: Zoom = zoomable ? zoom : 'width';
  const width = pdf ? pageWidth(mode, room, pdf.pageSize, pdf.pages > 1 ? PAGE_LABEL_HEIGHT : 0) : 0;
  const percent = pdf ? zoomPercent(width, pdf.pageSize) : 100;

  /** One step in or out, landing on a round number even when starting from a fit. */
  function step(direction: -1 | 1) {
    // From a fit, start from the exact size shown rather than the rounded readout.
    const from = typeof mode === 'number' ? mode : pdf ? (width / (pdf.pageSize.width * POINTS_TO_PIXELS)) * 100 : 100;
    setZoom(stepZoom(from, direction));
  }

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${fill ? 'min-h-0 flex-1' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Preview size">
        {zoomable && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!pdf || percent <= MIN_ZOOM}
              aria-label="Zoom out"
              title="Zoom out"
              className={toolButton}
            >
              <MinusIcon className="my-0.5" />
            </button>
            <span
              className="w-12 text-center text-sm font-extrabold text-stone-600 tabular-nums dark:text-stone-300"
              aria-live="polite"
              aria-label={`Zoom ${percent}%`}
            >
              {percent}%
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={!pdf || percent >= MAX_ZOOM}
              aria-label="Zoom in"
              title="Zoom in"
              className={toolButton}
            >
              <PlusIcon className="my-0.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom('page')}
              aria-pressed={mode === 'page'}
              className={`${toolButton} ml-1.5 ${mode === 'page' ? toolButtonOn : ''}`}
            >
              Fit page
            </button>
            <button
              type="button"
              onClick={() => setZoom('width')}
              aria-pressed={mode === 'width'}
              className={`${toolButton} ${mode === 'width' ? toolButtonOn : ''}`}
            >
              Fit width
            </button>
          </>
        )}
        {action}
      </div>

      <div
        ref={viewport}
        data-preview-viewport
        className={`bg-stone-200 p-4 dark:bg-stone-800 ${fill ? 'min-h-0 flex-1 overflow-auto' : ''} ${className}`}
      >
        {pdf ? (
          // As wide as the pages when they're zoomed past the panel, so every corner can be scrolled to.
          <div className="min-w-full" style={{ width: 'max-content' }}>
            <PdfPages pdf={pdf} working={working} width={width} />
          </div>
        ) : (
          loading && <Spinner label="Making your PDF" />
        )}
      </div>
    </div>
  );
}

/** The preview over the whole window. Escape or Close goes back. */
function PreviewOverlay({
  pdf,
  working,
  loading,
  onClose,
}: {
  pdf: OpenedPdf | null;
  working: boolean;
  loading: boolean;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKey);
    // The page behind stays put while this is open.
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = before;
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resume preview"
      className="fixed inset-0 z-50 flex flex-col bg-stone-50 p-3 sm:p-4 dark:bg-stone-950"
    >
      <PreviewPane
        pdf={pdf}
        working={working}
        loading={loading}
        zoomable
        fill
        className="rounded-xl"
        action={
          <button ref={closeButton} type="button" onClick={onClose} className={`${toolButton} ml-auto`}>
            <XIcon /> Close
          </button>
        }
      />
    </div>,
    document.body,
  );
}
