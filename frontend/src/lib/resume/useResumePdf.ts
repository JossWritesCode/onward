import { useEffect, useRef, useState } from 'react';
import type { ResumePageSize, ResumeTemplate } from '../../gql/graphql';
import type { ResumeContent } from './types';

export type ResumePdfState = {
  /** A link to the latest PDF, for the preview, "open in a new tab", and download. */
  url: string | null;
  pages: number;
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
export function useResumePdf(content: ResumeContent, template: ResumeTemplate, pageSize: ResumePageSize): ResumePdfState {
  const [state, setState] = useState<ResumePdfState>({ url: null, pages: 1, working: true, error: null });
  const urls = useRef<string[]>([]);
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setState((current) => (current.working ? current : { ...current, working: true }));

    const timer = setTimeout(
      async () => {
        try {
          const { renderResumePdf } = await import('../../resume-pdf');
          const { blob, pages } = await renderResumePdf({ content, template, pageSize });
          if (cancelled) return;

          const url = URL.createObjectURL(blob);
          urls.current.push(url);
          // Keep the previous one alive briefly: the preview may still be showing it.
          while (urls.current.length > 2) URL.revokeObjectURL(urls.current.shift()!);
          setState({ url, pages, working: false, error: null });
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
  }, [content, template, pageSize]);

  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current = [];
    },
    [],
  );

  return state;
}
