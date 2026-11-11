import { useEffect, useRef, useState } from 'react';
import type { ResumePageSize, ResumeTemplate } from '../../gql/graphql';
import type { OpenedPdf } from '../../resume-pdf/pages';
import type { StyleValues } from './style';
import type { ResumeContent } from './types';

export type ResumePdfState = {
  /** A link to the latest PDF, for download. */
  url: string | null;
  /** The latest PDF, opened for drawing its pages. */
  opened: OpenedPdf | null;
  pages: number;
  /** How far down the last page the content reaches, 0 to 1. */
  lastPageFill: number;
  /** True while a newer version is being made. */
  working: boolean;
  error: string | null;
};

const DELAY = 450;

/**
 * Keeps a PDF of the resume up to date as it's edited, a moment after typing
 * stops. The PDF code is downloaded the first time this runs, so only the
 * resume editor pays for it.
 */
export function useResumePdf(content: ResumeContent, template: ResumeTemplate, pageSize: ResumePageSize, style: StyleValues): ResumePdfState {
  const [state, setState] = useState<ResumePdfState>({ url: null, opened: null, pages: 1, lastPageFill: 0, working: true, error: null });
  const previous = useRef<{ url: string; opened: OpenedPdf }[]>([]);
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setState((current) => (current.working ? current : { ...current, working: true }));

    const timer = setTimeout(
      async () => {
        try {
          const [{ renderResumePdf }, { openPdf }] = await Promise.all([import('../../resume-pdf'), import('../../resume-pdf/pages')]);
          const { blob, pages } = await renderResumePdf({ content, template, pageSize, style });
          const opened = await openPdf(await blob.arrayBuffer());
          const lastPageFill = pages > 1 ? await opened.lastPageFill() : 0;
          if (cancelled) {
            opened.close();
            return;
          }

          const url = URL.createObjectURL(blob);
          previous.current.push({ url, opened });
          // Keep the one before alive briefly: the preview may still be showing it.
          while (previous.current.length > 2) {
            const old = previous.current.shift()!;
            URL.revokeObjectURL(old.url);
            old.opened.close();
          }
          setState({ url, opened, pages, lastPageFill, working: false, error: null });
        } catch (caught) {
          if (cancelled) return;
          console.error(caught);
          setState((current) => ({ ...current, working: false, error: "We couldn't make the PDF. Try reloading the page." }));
        }
      },
      first.current ? 0 : DELAY,
    );
    first.current = false;

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, template, pageSize, style]);

  useEffect(
    () => () => {
      previous.current.forEach((old) => {
        URL.revokeObjectURL(old.url);
        old.opened.close();
      });
      previous.current = [];
    },
    [],
  );

  return state;
}
