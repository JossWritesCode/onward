import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useParams } from 'react-router';
import type { ResumePageSize, ResumeQuery as ResumeQueryData, ResumeTemplate } from '../gql/graphql';
import { ResumeQuery, UpdateResumeMutation } from '../graphql/operations';
import { generalErrors, fieldError, type UserError } from '../lib/errors';
import { plural } from '../lib/activities';
import { PAGE_SIZES, TEMPLATES, pdfFileName, toResumeContent, type ResumeContent } from '../lib/resume/types';
import { useResumePdf } from '../lib/resume/useResumePdf';
import { useMediaQuery } from '../lib/useMediaQuery';
import PdfFrame from '../components/resume/PdfFrame';
import ResumeForm from '../components/resume/ResumeForm';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, ExternalLinkIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Select, Spinner, buttonClasses } from '../components/ui';

type Existing = ResumeQueryData['resume'];
type Draft = { title: string; template: ResumeTemplate; pageSize: ResumePageSize; content: ResumeContent };

const toDraft = (resume: Existing): Draft => ({
  title: resume.title,
  template: resume.template,
  pageSize: resume.pageSize,
  content: toResumeContent(resume.content),
});

/** The editor at /resumes/:id: the form on the left, the PDF on the right. */
export default function ResumeEditorPage() {
  const { id = '' } = useParams();
  // Loaded once: after that, the form is the source of truth until you save.
  const { data, loading, error } = useQuery(ResumeQuery, { variables: { id }, fetchPolicy: 'network-only' });

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBanner messages={[error?.message ?? "We couldn't find that resume."]} />;
  return <ResumeEditor key={id} resume={data.resume} />;
}

function ResumeEditor({ resume }: { resume: Existing }) {
  const [saved, setSaved] = useState<Draft>(() => toDraft(resume));
  const [draft, setDraft] = useState<Draft>(saved);
  const [errors, setErrors] = useState<UserError[]>([]);
  const [updateResume, { loading: saving }] = useMutation(UpdateResumeMutation, { refetchQueries: ['Resumes'] });

  const wide = useMediaQuery('(min-width: 1024px)');
  const pdf = useResumePdf(draft.content, draft.template, draft.pageSize);
  const fileName = pdfFileName(draft.content, draft.title);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // Ask before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = draft;
    setErrors([]);
    try {
      const result = (await updateResume({ variables: { id: resume.id, input: sent } })).data?.updateResume;
      if (result?.resume) {
        // The server tidies things up (dates like "Aug 2022" become 2022-08,
        // blank bullets go). Take its version, unless you kept typing meanwhile.
        const fresh = toDraft(result.resume);
        setSaved(fresh);
        setDraft((current) => (current === sent ? fresh : current));
      } else {
        setErrors(result?.errors ?? [{ message: 'Something went wrong. Try again.' }]);
      }
    } catch (caught) {
      setErrors([{ message: caught instanceof Error ? caught.message : 'Something went wrong. Try again.' }]);
    }
  }

  const tooLong = pdf.pages > 1 && (
    <p
      role="status"
      className="rounded-xl border-2 border-gold-300 bg-gold-100 px-3 py-2 text-sm font-semibold text-stone-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      This runs onto {plural(pdf.pages, 'page')}. Most resumes are best at one: try trimming a bullet or two.
    </p>
  );

  const pdfButtons = pdf.url && (
    <>
      {!wide && (
        <a href={pdf.url} target="_blank" rel="noreferrer" className={buttonClasses('secondary')}>
          <ExternalLinkIcon /> Preview PDF
        </a>
      )}
      <a href={pdf.url} download={fileName} className={buttonClasses('secondary')}>
        <DownloadIcon /> Download PDF
      </a>
    </>
  );

  return (
    <div>
      <Link
        to="/resumes"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> Resumes
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5">
          <ErrorBanner messages={generalErrors(errors, ['title'])} />

          <Card className="space-y-4 p-5">
            <Field
              label="Resume name"
              htmlFor="resume-title"
              required
              hint="Only you see this. It helps you tell versions apart."
              error={fieldError(errors, 'title')}
            >
              <Input
                id="resume-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Frontend v3"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Page size" htmlFor="resume-page-size">
                <Select
                  id="resume-page-size"
                  value={draft.pageSize}
                  onChange={(e) => setDraft({ ...draft, pageSize: e.target.value as ResumePageSize })}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {/* Shows up once there's more than one template to pick from. */}
              {TEMPLATES.length > 1 && (
                <Field label="Template" htmlFor="resume-template">
                  <Select
                    id="resume-template"
                    value={draft.template}
                    onChange={(e) => setDraft({ ...draft, template: e.target.value as ResumeTemplate })}
                  >
                    {TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          </Card>

          <ResumeForm content={draft.content} onChange={(content) => setDraft((current) => ({ ...current, content }))} />

          {/* Stays in reach at the bottom of the screen while you scroll the form. */}
          <div className="sticky bottom-0 z-10 -mx-4 space-y-2 border-t-2 border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
            {!wide && tooLong}
            {!wide && pdf.error && <ErrorBanner messages={[pdf.error]} />}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {!wide && pdfButtons}
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400" role="status">
                {dirty ? (
                  'Unsaved changes'
                ) : (
                  <>
                    <CheckIcon /> Saved
                  </>
                )}
              </span>
            </div>
          </div>
        </form>

        {wide && (
          <aside className="sticky top-20 flex h-[calc(100dvh-6.5rem)] min-w-0 flex-col gap-3" aria-label="PDF preview">
            <div className="flex flex-wrap items-center gap-3">
              {pdfButtons}
              <span className="text-sm text-stone-500 dark:text-stone-400" role="status">
                {pdf.working ? 'Updating preview…' : dirty ? 'Preview shows your unsaved changes.' : ''}
              </span>
            </div>
            {tooLong}
            {pdf.error && <ErrorBanner messages={[pdf.error]} />}
            <div className="min-h-0 flex-1">
              {pdf.url ? <PdfFrame url={pdf.url} title="Resume preview" /> : !pdf.error && <Spinner label="Making your PDF" />}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
