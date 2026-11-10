import { pdf } from '@react-pdf/renderer';
import type { ResumePageSize, ResumeTemplate } from '../gql/graphql';
import type { ResumeContent } from '../lib/resume/types';
import { registerFonts } from './fonts';
import { TEMPLATE_DOCUMENTS } from './templates';

// Everything that needs @react-pdf/renderer lives in this folder, and the rest
// of the app only reaches it through `import('../resume-pdf')`. That keeps the
// PDF library (it's big) out of every page except the resume editor.

export type ResumePdfInput = { content: ResumeContent; template: ResumeTemplate; pageSize: ResumePageSize };
export type ResumePdf = { blob: Blob; pages: number };

/** How many pages a PDF has, counted from the page objects in the file itself. */
export function countPages(bytes: Uint8Array): number {
  let text = '';
  for (let start = 0; start < bytes.length; start += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return text.match(/\/Type\s*\/Page(?![A-Za-z])/g)?.length ?? 1;
}

/** Makes the PDF in the browser. Nothing is sent to the server. */
export async function renderResumePdf({ content, template, pageSize }: ResumePdfInput): Promise<ResumePdf> {
  registerFonts();
  const Template = TEMPLATE_DOCUMENTS[template] ?? TEMPLATE_DOCUMENTS.CLASSIC;
  const blob = await pdf(<Template content={content} pageSize={pageSize} />).toBlob();
  return { blob, pages: countPages(new Uint8Array(await blob.arrayBuffer())) };
}
