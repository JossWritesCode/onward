import type { MouseEvent } from 'react';
import { FileTextIcon } from '../icons';

/**
 * The name of an application's tailored resume, on board cards and list rows.
 * Cards are already links, and a link can't sit inside a link, so the card's
 * own click handler asks `resumePathFromClick` whether the tag was the target.
 */
export default function ResumeTag({ resume, className = '' }: { resume: { id: string; title: string }; className?: string }) {
  return (
    <span
      data-resume-id={resume.id}
      title={`Open resume: ${resume.title}`}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border border-transparent px-1.5 py-0.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:underline dark:text-brand-300 dark:hover:bg-brand-tint dark:hover:text-brand-250 ${className}`}
    >
      <FileTextIcon className="shrink-0" />
      <span className="truncate">{resume.title}</span>
    </span>
  );
}

/** "/resumes/12" if the click landed on a resume tag, otherwise null. */
export function resumePathFromClick(event: MouseEvent): string | null {
  const tag = (event.target as Element).closest?.('[data-resume-id]');
  const id = tag?.getAttribute('data-resume-id');
  return id ? `/resumes/${id}` : null;
}
