import type { ResumePageSize, ResumeTemplate } from '../../gql/graphql';
import { toStyleValues, type StyleValues } from './style';
import { pdfFileName, toResumeContent } from './types';

type Downloadable = { title: string; template: ResumeTemplate; pageSize: ResumePageSize; content: unknown; style: StyleValues };

/**
 * Makes a resume's PDF and saves it, without opening the editor. The PDF
 * code is downloaded the first time this runs.
 */
export async function downloadResumePdf(resume: Downloadable, application?: { role: string; company: string } | null) {
  const content = toResumeContent(resume.content);
  const { renderResumePdf } = await import('../../resume-pdf');
  const { blob } = await renderResumePdf({ content, template: resume.template, pageSize: resume.pageSize, style: toStyleValues(resume.style) });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pdfFileName(content, resume.title, application);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
