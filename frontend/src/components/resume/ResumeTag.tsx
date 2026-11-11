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
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-extrabold text-stone-600 hover:bg-brand-100 hover:text-brand-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-brand-900/50 dark:hover:text-brand-200 ${className}`}
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
