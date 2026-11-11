import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Draws a finished PDF's pages onto canvases, with pdf.js. This is how the
// preview works in every browser, whatever its PDF settings are, and how we
// know how full the last page is.

GlobalWorkerOptions.workerSrc = workerUrl;

/** How much of the page the text reaches down to, 0 to 1. For a one-page resume this is page 1; otherwise the last page. */
export type Overflow = { pages: number; lastPageFill: number };

export type OpenedPdf = {
  pages: number;
  /** The page's size in PDF points. */
  pageSize: { width: number; height: number };
  /** Draws a page (1-based) onto a canvas at the given CSS width. */
  draw: (page: number, canvas: HTMLCanvasElement, cssWidth: number) => Promise<void>;
  /** How far down the last page the content goes, 0 to 1. */
  lastPageFill: () => Promise<number>;
  close: () => void;
};

export async function openPdf(bytes: ArrayBuffer): Promise<OpenedPdf> {
  const task = getDocument({ data: new Uint8Array(bytes) });
  const document: PDFDocumentProxy = await task.promise;
  const first = await document.getPage(1);
  const { width, height } = first.getViewport({ scale: 1 });

  return {
    pages: document.numPages,
    pageSize: { width, height },

    async draw(number, canvas, cssWidth) {
      const page = await document.getPage(number);
      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      const scale = cssWidth / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale: scale * ratio });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
      const context = canvas.getContext('2d');
      if (!context) return;
      await page.render({ canvasContext: context, canvas, viewport }).promise;
    },

    async lastPageFill() {
      const page = await document.getPage(document.numPages);
      const { height: pageHeight } = page.getViewport({ scale: 1 });
      const { items } = await page.getTextContent();
      // Text positions are from the bottom of the page, so the lowest text has the smallest y.
      let lowest = pageHeight;
      for (const item of items) {
        if ('transform' in item && item.str.trim()) lowest = Math.min(lowest, item.transform[5]);
      }
      return Math.min(1, Math.max(0, (pageHeight - lowest) / pageHeight));
    },

    close() {
      void task.destroy();
    },
  };
}
