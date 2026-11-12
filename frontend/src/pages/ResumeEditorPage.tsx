import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useParams } from 'react-router';
import type { ResumePageSize, ResumeQuery as ResumeQueryData, ResumeTemplate } from '../gql/graphql';
import { JobApplicationsQuery, ResumeQuery, UpdateResumeMutation } from '../graphql/operations';
import { generalErrors, fieldError, type UserError } from '../lib/errors';
import { overflowMessage } from '../lib/resume/overflow';
import { toStyleValues, type StyleValues } from '../lib/resume/style';
import { PAGE_SIZES, pdfFileName, toResumeContent, type ResumeContent } from '../lib/resume/types';
import { useResumePdf } from '../lib/resume/useResumePdf';
import { useDesignOpen } from '../lib/preferences';
import { useMediaQuery } from '../lib/useMediaQuery';
import DesignPanel from '../components/resume/DesignPanel';
import ResumePreview from '../components/resume/ResumePreview';
import ResumeForm from '../components/resume/ResumeForm';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, DownloadIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Select, Spinner, buttonClasses } from '../components/ui';

type Existing = ResumeQueryData['resume'];
type Draft = {
  title: string;
  template: ResumeTemplate;
  pageSize: ResumePageSize;
  style: StyleValues;
  content: ResumeContent;
  /** The application this is tailored for, or '' for a base resume. */
  jobApplicationId: string;
};

const toDraft = (resume: Existing): Draft => ({
  title: resume.title,
  template: resume.template,
  pageSize: resume.pageSize,
  style: toStyleValues(resume.style),
  content: toResumeContent(resume.content),
  jobApplicationId: resume.jobApplication?.id ?? '',
});

/** The editor at /resumes/:id: the form on the left, the design panel and preview on the right. */
export default function ResumeEditorPage() {
  const { id = '' } = useParams();
  // Loaded once: after that, the form is the source of truth until you save.
  const { data, loading, error } = useQuery(ResumeQuery, { variables: { id }, fetchPolicy: 'network-only' });

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBanner messages={[error?.message ?? "We couldn't find that resume."]} />;
  return <ResumeEditor key={id} resume={data.resume} />;
}

const tab =
  'flex-1 rounded-xl px-3 py-1.5 text-center font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';

function ResumeEditor({ resume }: { resume: Existing }) {
  const [saved, setSaved] = useState<Draft>(() => toDraft(resume));
  const [draft, setDraft] = useState<Draft>(saved);
  const [errors, setErrors] = useState<UserError[]>([]);
  const [updateResume, { loading: saving }] = useMutation(UpdateResumeMutation, {
    refetchQueries: ['Resumes', 'Board', 'JobApplications', 'JobApplication'],
  });

  const wide = useMediaQuery('(min-width: 1024px)');
  // On phones, the form and the preview take turns.
  const [tabShown, setTabShown] = useState<'edit' | 'preview'>('edit');
  // Closed until you open it, so the preview gets the room. Your choice is remembered.
  const [designOpen, setDesignOpen] = useDesignOpen();

  const pdf = useResumePdf(draft.content, draft.template, draft.pageSize, draft.style);
  // The applications to pick from. The one saved on the resume is known even before this loads.
  const { data: applicationsData } = useQuery(JobApplicationsQuery);
  const applications = applicationsData?.jobApplications ?? [];
  const application =
    applications.find((candidate) => candidate.id === draft.jobApplicationId) ??
    (resume.jobApplication?.id === draft.jobApplicationId ? resume.jobApplication : null);
  const fileName = pdfFileName(draft.content, draft.title, application);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // Ask before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    const sent = draft;
    setErrors([]);
    try {
      const result = (
        await updateResume({
          variables: { id: resume.id, input: { ...sent, jobApplicationId: sent.jobApplicationId || null } },
        })
      ).data?.updateResume;
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  const tooLong = pdf.pages > 1 && (
    <p
      role="status"
      className="rounded-xl border-2 border-gold-300 bg-gold-100 px-3 py-2 text-sm font-semibold text-stone-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      {overflowMessage(pdf.pages, pdf.lastPageFill)}
    </p>
  );

  const downloadButton = pdf.url && (
    <a href={pdf.url} download={fileName} className={buttonClasses('secondary')}>
      <DownloadIcon /> Download PDF
    </a>
  );

  const previewStatus = (
    <span className="text-sm text-stone-500 dark:text-stone-400" role="status">
      {pdf.working ? 'Updating preview…' : dirty ? 'Preview shows your unsaved changes.' : ''}
    </span>
  );

  const design = (
    <Card className="p-4">
      <button
        type="button"
        aria-expanded={designOpen}
        onClick={() => setDesignOpen(!designOpen)}
        className="flex w-full items-center gap-2 text-left text-lg font-black"
      >
        <ChevronDownIcon className={`transition-transform ${designOpen ? '' : '-rotate-90'}`} />
        Design
        {!designOpen && (
          <span className="ml-auto text-sm font-bold text-stone-500 dark:text-stone-400">
            {draft.template.charAt(0) + draft.template.slice(1).toLowerCase()}
          </span>
        )}
      </button>
      {designOpen && (
        <div className="mt-3">
          <DesignPanel
            template={draft.template}
            style={draft.style}
            onChange={(change) => setDraft((current) => ({ ...current, ...change }))}
          />
        </div>
      )}
    </Card>
  );

  const preview = (layout: 'panel' | 'flow') => (
    <ResumePreview
      pdf={pdf.opened}
      working={pdf.working}
      loading={!pdf.error}
      layout={layout}
      className={layout === 'panel' ? 'rounded-xl' : '-mx-4'}
    />
  );

  // The form and the preview are the same on every screen; what differs is where they sit.
  const form = (
    <>
      <ErrorBanner messages={generalErrors(errors, ['title', 'jobApplicationId'])} />

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
      </Card>

      <Card className="space-y-3 p-5">
        <Field
          label="Job application"
          htmlFor="resume-application"
          error={fieldError(errors, 'jobApplicationId')}
          hint={
            application
              ? `Tailored for this job. It shows on the card, and downloads as "${fileName}".`
              : 'A base resume. Pick an application to make this the resume tailored for it.'
          }
        >
          <Select
            id="resume-application"
            value={draft.jobApplicationId}
            onChange={(e) => setDraft({ ...draft, jobApplicationId: e.target.value })}
          >
            <option value="">None: this is a base resume</option>
            {/* Shown while the list loads, so the saved choice never looks blank. */}
            {application && !applications.some((candidate) => candidate.id === application.id) && (
              <option value={application.id}>
                {application.company} · {application.role}
              </option>
            )}
            {applications.map((candidate) => {
              const taken = Boolean(candidate.resume) && candidate.resume?.id !== resume.id;
              return (
                <option key={candidate.id} value={candidate.id} disabled={taken}>
                  {candidate.company} · {candidate.role}
                  {taken ? ' (has a resume)' : ''}
                </option>
              );
            })}
          </Select>
        </Field>
        {(application || resume.basedOn) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
            {application && (
              <Link to={`/applications/${application.id}`} className="text-brand-600 hover:underline dark:text-brand-300">
                Open the {application.company} card
              </Link>
            )}
            {resume.basedOn && (
              <Link to={`/resumes/${resume.basedOn.id}`} className="text-stone-500 hover:text-brand-600 dark:text-stone-400">
                Tailored from {resume.basedOn.title}
              </Link>
            )}
          </p>
        )}
      </Card>

      <ResumeForm content={draft.content} onChange={(content) => setDraft((current) => ({ ...current, content }))} />
    </>
  );

  const saveBar = (extra?: ReactNode) => (
    <div className="sticky bottom-0 z-10 -mx-4 space-y-2 border-t-2 border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      {extra}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {!wide && downloadButton}
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
  );

  const backLink = (
    <Link
      to="/resumes"
      className={`inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400 ${wide ? '' : 'mb-4'}`}
    >
      <ArrowLeftIcon /> Resumes
    </Link>
  );

  return (
    <div>
      {!wide && backLink}

      {wide ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5">
            {/* In the form's column, so the preview starts at the top and a whole page fits without scrolling. */}
            <div className="-mb-1">{backLink}</div>
            {form}
            {saveBar()}
          </form>

          <aside className="sticky top-20 flex h-[calc(100dvh-6.5rem)] min-w-0 flex-col gap-3" aria-label="Design and preview">
            <div className="flex flex-wrap items-center gap-3">
              {downloadButton}
              {previewStatus}
            </div>
            {design}
            {tooLong}
            {pdf.error && <ErrorBanner messages={[pdf.error]} />}
            {preview('panel')}
          </aside>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5">
          <div className="sticky top-16 z-10 -mx-4 bg-stone-50/95 px-4 py-2 backdrop-blur dark:bg-stone-950/95">
            <div className="flex gap-1 rounded-2xl bg-stone-200 p-1 dark:bg-stone-800" role="tablist">
              {(['edit', 'preview'] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={tabShown === name}
                  onClick={() => setTabShown(name)}
                  className={`${tab} ${tabShown === name ? 'bg-white text-brand-700 shadow dark:bg-stone-900 dark:text-brand-200' : 'text-stone-600 dark:text-stone-300'}`}
                >
                  {name === 'edit' ? 'Edit' : 'Preview'}
                </button>
              ))}
            </div>
          </div>

          {tabShown === 'edit' ? (
            form
          ) : (
            <div className="space-y-3">
              {previewStatus}
              {design}
              {pdf.error && <ErrorBanner messages={[pdf.error]} />}
              {preview('flow')}
            </div>
          )}

          {saveBar(
            <>
              {tooLong}
              {tabShown === 'edit' && pdf.error && <ErrorBanner messages={[pdf.error]} />}
            </>,
          )}
        </form>
      )}
    </div>
  );
}
