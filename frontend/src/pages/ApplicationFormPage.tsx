import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import type {
  JobApplicationInput,
  JobApplicationQuery as JobApplicationQueryData,
  WorkArrangement,
} from '../gql/graphql';
import {
  ContactsQuery,
  CreateContactMutation,
  CreateJobApplicationMutation,
  DeleteJobApplicationMutation,
  JobApplicationQuery,
  PostingUrlsQuery,
  StagesQuery,
  UpdateJobApplicationMutation,
} from '../graphql/operations';
import { importedJobFromHash, postingKey, type ImportedJob } from '../lib/bookmarklet';
import { celebrateMove } from '../lib/celebrate';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { blankToNull, formatDate } from '../lib/format';
import { WORK_ARRANGEMENTS, WORK_ARRANGEMENT_LABELS } from '../lib/status';
import LinkPicker from '../components/LinkPicker';
import InterviewRoundCard from '../components/prep/InterviewRoundCard';
import ApplicationResume from '../components/resume/ApplicationResume';
import { ArrowLeftIcon, BookmarkIcon, ExternalLinkIcon, TrashIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Select, Spinner, Textarea } from '../components/ui';

type FormState = {
  company: string;
  role: string;
  stageId: string;
  dateApplied: string;
  followUpOn: string;
  postingUrl: string;
  salaryRange: string;
  location: string;
  workArrangement: WorkArrangement | '';
  jobDescription: string;
  resumeVersion: string;
  notes: string;
  contactIds: string[];
};

const FIELDS = [
  'company',
  'role',
  'stage',
  'dateApplied',
  'followUpOn',
  'postingUrl',
  'salaryRange',
  'location',
  'workArrangement',
  'jobDescription',
  'resumeVersion',
  'notes',
];

const EMPTY_FORM: FormState = {
  company: '',
  role: '',
  stageId: '',
  dateApplied: '',
  followUpOn: '',
  postingUrl: '',
  salaryRange: '',
  location: '',
  workArrangement: '',
  jobDescription: '',
  resumeVersion: '',
  notes: '',
  contactIds: [],
};

type ExistingApplication = JobApplicationQueryData['jobApplication'];

function formFrom(application: ExistingApplication): FormState {
  return {
    company: application.company,
    role: application.role,
    stageId: application.stage.id,
    dateApplied: application.dateApplied ?? '',
    followUpOn: application.followUpOn ?? '',
    postingUrl: application.postingUrl ?? '',
    salaryRange: application.salaryRange ?? '',
    location: application.location ?? '',
    workArrangement: application.workArrangement ?? '',
    jobDescription: application.jobDescription ?? '',
    resumeVersion: application.resumeVersion ?? '',
    notes: application.notes ?? '',
    contactIds: application.contacts.map((contact) => contact.id),
  };
}

function inputFrom(form: FormState): JobApplicationInput {
  return {
    company: form.company,
    role: form.role,
    stageId: form.stageId || null,
    dateApplied: form.dateApplied || null,
    // The server clears it for columns without follow-ups.
    followUpOn: form.followUpOn || null,
    postingUrl: blankToNull(form.postingUrl),
    salaryRange: blankToNull(form.salaryRange),
    location: blankToNull(form.location),
    workArrangement: form.workArrangement || null,
    jobDescription: blankToNull(form.jobDescription),
    resumeVersion: blankToNull(form.resumeVersion),
    notes: blankToNull(form.notes),
    contactIds: form.contactIds,
  };
}

/** Handles both /applications/new and /applications/:id. */
export default function ApplicationFormPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(JobApplicationQuery, {
    variables: { id: id ?? '' },
    skip: !id,
  });

  if (!id) return <ApplicationForm key="new" />;
  if (loading && !data) return <Spinner />;
  if (error || !data) {
    return <ErrorBanner messages={[error?.message ?? "We couldn't find that application."]} />;
  }
  return <ApplicationForm key={id} existing={data.jobApplication} />;
}

/** Form fields from a job the "Save to Onward" bookmark read. */
function formFromImport(job: ImportedJob): FormState {
  return {
    ...EMPTY_FORM,
    company: job.company?.slice(0, 200) ?? '',
    role: job.role?.slice(0, 200) ?? '',
    postingUrl: job.postingUrl ?? '',
    salaryRange: job.salaryRange ?? '',
    location: job.location ?? '',
    workArrangement: job.workArrangement && WORK_ARRANGEMENTS.includes(job.workArrangement) ? job.workArrangement : '',
    jobDescription: job.jobDescription ?? '',
  };
}

function ApplicationForm({ existing }: { existing?: ExistingApplication }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The "Save to Onward" bookmark passes the job in the address after #import=.
  const [imported] = useState(() => (existing ? null : importedJobFromHash(window.location.hash)));
  const [form, setForm] = useState<FormState>(
    existing
      ? formFrom(existing)
      : imported
        ? formFromImport(imported)
        : { ...EMPTY_FORM, stageId: searchParams.get('stage') ?? '' },
  );

  // Tidy the address so a reload doesn't fill the form in again.
  useEffect(() => {
    if (imported) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }, [imported]);

  const { data: postingsData } = useQuery(PostingUrlsQuery, { skip: !imported });
  const importedKey = postingKey(imported?.postingUrl);
  const duplicate = importedKey
    ? postingsData?.jobApplications.find((application) => postingKey(application.postingUrl) === importedKey)
    : undefined;
  const [errors, setErrors] = useState<UserError[]>([]);
  const { data: contactsData } = useQuery(ContactsQuery);
  const { data: stagesData } = useQuery(StagesQuery);
  const stages = [...(stagesData?.stages ?? [])].sort((a, b) => a.position - b.position);
  const selectedStage = stages.find((stage) => stage.id === form.stageId);
  // Only cards in applied and interview columns get follow-up dates.
  const followUpTracked = selectedStage?.kind === 'APPLIED' || selectedStage?.kind === 'INTERVIEWING';

  // New applications start in the first "saved" column unless a column was picked.
  useEffect(() => {
    if (form.stageId || stages.length === 0) return;
    const fallback = stages.find((stage) => stage.kind === 'SAVED') ?? stages[0];
    setForm((current) => ({ ...current, stageId: fallback.id }));
  }, [form.stageId, stages]);

  const [createContact] = useMutation(CreateContactMutation, {
    refetchQueries: ['Contacts'],
    awaitRefetchQueries: true,
  });

  async function addContact(name: string, title: string) {
    const { data } = await createContact({ variables: { input: { name, title: title.trim() || null } } });
    const result = data?.createContact;
    if (!result?.contact) {
      throw new Error(result?.errors.map((error) => error.message).join(' ') || "Couldn't add that contact.");
    }
    const newId = result.contact.id;
    setForm((current) => ({ ...current, contactIds: [...current.contactIds, newId] }));
  }

  const refetchQueries = ['Board', 'JobApplications', 'Contacts', 'Streak', 'Progress', 'Today'];
  const [createApplication, { loading: creating }] = useMutation(CreateJobApplicationMutation, { refetchQueries });
  const [updateApplication, { loading: updating }] = useMutation(UpdateJobApplicationMutation, { refetchQueries });
  const [deleteApplication, { loading: deleting }] = useMutation(DeleteJobApplicationMutation, { refetchQueries });
  const saving = creating || updating;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputFrom(form);
    try {
      const result = existing
        ? (await updateApplication({ variables: { id: existing.id, input } })).data?.updateJobApplication
        : (await createApplication({ variables: { input } })).data?.createJobApplication;

      if (result && result.errors.length === 0) {
        if (selectedStage && (!existing || existing.stage.id !== selectedStage.id)) {
          celebrateMove({
            from: existing ? { kind: existing.stage.kind, position: existing.stage.position } : null,
            to: { kind: selectedStage.kind, position: selectedStage.position },
          });
        }
        navigate('/applications');
      } else {
        setErrors(result?.errors ?? [{ message: 'Something went wrong. Try again.' }]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (caught) {
      setErrors([{ message: caught instanceof Error ? caught.message : 'Something went wrong. Try again.' }]);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!window.confirm(`Delete your application to ${existing.company}? This can't be undone.`)) return;
    await deleteApplication({ variables: { id: existing.id } });
    navigate('/applications');
  }

  const contactOptions = (contactsData?.contacts ?? []).map((contact) => ({
    id: contact.id,
    label: contact.name,
    detail: contact.company,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/applications"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> All applications
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {existing ? `${existing.company}` : 'Add an application'}
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            {existing
              ? `${existing.role} · last updated ${formatDate(existing.updatedAt.slice(0, 10))}`
              : 'Saved for later or already sent, it all counts.'}
            {!existing && !imported && (
              <>
                {' '}
                <Link to="/account" className="font-bold text-brand-600 hover:underline dark:text-brand-300">
                  Save jobs from LinkedIn in one click
                </Link>
              </>
            )}
          </p>
        </div>
        {existing?.postingUrl && (
          <a
            href={existing.postingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            View posting <ExternalLinkIcon />
          </a>
        )}
      </div>

      {existing && existing.interviewRounds.length > 0 && (
        <section className="mb-6" aria-labelledby="rounds-heading">
          <h2 id="rounds-heading" className="mb-3 text-xl font-black">
            Interview prep
          </h2>
          <div className="space-y-3">
            {[...existing.interviewRounds].reverse().map((round) => (
              <InterviewRoundCard key={round.id} round={round} company={existing.company} />
            ))}
          </div>
        </section>
      )}

      {existing && <ApplicationResume application={existing} />}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <ErrorBanner messages={generalErrors(errors, FIELDS)} />

        {imported && (
          <ImportBanner
            source={imported.source}
            missing={[!form.company && 'company', !form.role && 'job title'].filter((field): field is string => Boolean(field))}
            duplicate={duplicate}
            applied={selectedStage?.kind === 'APPLIED'}
            onAppliedChange={(applied) => {
              const target = stages.find((stage) => stage.kind === (applied ? 'APPLIED' : 'SAVED'));
              if (target) set('stageId', target.id);
            }}
          />
        )}

        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Company" htmlFor="company" required error={fieldError(errors, 'company')}>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Brightline"
              required
            />
          </Field>
          <Field label="Role" htmlFor="role" required error={fieldError(errors, 'role')}>
            <Input
              id="role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Frontend Developer"
              required
            />
          </Field>
          <Field label="Column" htmlFor="stage" error={fieldError(errors, 'stage')}>
            <Select id="stage" value={form.stageId} onChange={(e) => set('stageId', e.target.value)}>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Date applied"
            htmlFor="date-applied"
            hint={selectedStage?.kind === 'APPLIED' && !form.dateApplied ? 'Leave blank to use today.' : undefined}
            error={fieldError(errors, 'dateApplied')}
          >
            <Input
              id="date-applied"
              type="date"
              value={form.dateApplied}
              onChange={(e) => set('dateApplied', e.target.value)}
            />
          </Field>
          <Field
            label="Follow up on"
            htmlFor="follow-up-on"
            hint={followUpHint(form, existing, followUpTracked)}
            error={fieldError(errors, 'followUpOn')}
          >
            <div className="flex items-center gap-2">
              <Input
                id="follow-up-on"
                type="date"
                value={followUpTracked ? form.followUpOn : ''}
                disabled={!followUpTracked}
                className="disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(e) => set('followUpOn', e.target.value)}
              />
              {followUpTracked && form.followUpOn && (
                <Button
                  variant="ghost"
                  className="shrink-0"
                  aria-label="Clear the follow-up date"
                  onClick={() => set('followUpOn', '')}
                >
                  Clear
                </Button>
              )}
            </div>
          </Field>
        </Card>

        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Job posting link" htmlFor="posting-url" className="sm:col-span-2" error={fieldError(errors, 'postingUrl')}>
            <Input
              id="posting-url"
              type="url"
              value={form.postingUrl}
              onChange={(e) => set('postingUrl', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Location" htmlFor="location" error={fieldError(errors, 'location')}>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Toronto, ON"
            />
          </Field>
          <Field label="Work arrangement" htmlFor="work-arrangement" error={fieldError(errors, 'workArrangement')}>
            <Select
              id="work-arrangement"
              value={form.workArrangement}
              onChange={(e) => set('workArrangement', e.target.value as WorkArrangement | '')}
            >
              <option value="">Not sure yet</option>
              {WORK_ARRANGEMENTS.map((arrangement) => (
                <option key={arrangement} value={arrangement}>
                  {WORK_ARRANGEMENT_LABELS[arrangement]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Salary range" htmlFor="salary-range" error={fieldError(errors, 'salaryRange')}>
            <Input
              id="salary-range"
              value={form.salaryRange}
              onChange={(e) => set('salaryRange', e.target.value)}
              placeholder="$90k–$110k"
            />
          </Field>
          {/* Once a resume is linked (see the Resume section above), this note isn't needed. */}
          {!existing?.resume && (
            <Field
              label="Resume version"
              htmlFor="resume-version"
              hint={
                existing
                  ? 'For a resume kept outside Onward. Or tailor one above.'
                  : 'Which resume you sent. After saving, you can tailor one in Onward from this page.'
              }
              error={fieldError(errors, 'resumeVersion')}
            >
              <Input
                id="resume-version"
                value={form.resumeVersion}
                onChange={(e) => set('resumeVersion', e.target.value)}
                placeholder="Frontend v3"
              />
            </Field>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <LinkPicker
            legend="Contacts"
            options={contactOptions}
            selected={form.contactIds}
            onChange={(ids) => set('contactIds', ids)}
            onCreate={addContact}
            empty="No contacts yet. Add a recruiter, a referral, or anyone helping with this one."

          />
          <Field label="Job description" htmlFor="job-description" hint="Paste it in so you still have it if the posting comes down.">
            <Textarea
              id="job-description"
              rows={6}
              value={form.jobDescription}
              onChange={(e) => set('jobDescription', e.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Who you talked to, what stood out, next steps…"
            />
          </Field>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Add application'}
          </Button>
          <Link to="/applications" className="px-3 py-2 font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400">
            Cancel
          </Link>
          {existing && (
            <Button variant="ghostDanger" className="ml-auto" onClick={handleDelete} disabled={deleting}>
              <TrashIcon /> Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

const STEP_HINTS: Record<string, string> = {
  FOLLOW_UP: 'Next up: a short follow-up.',
  THANK_YOU: 'Next up: a thank-you note.',
  CHECK_IN: 'Next up: a friendly check-in.',
  LAST_NOTE: 'Next up: a last gracious note.',
  LET_GO: 'Next up: deciding whether to let this one go.',
};

/** What the follow-up date means for this card, shown under the field. */
function followUpHint(form: FormState, existing: ExistingApplication | undefined, tracked: boolean) {
  if (!tracked) return 'For cards in applied and interview columns.';
  const changingColumn = existing?.stage.id !== form.stageId;
  if (changingColumn) {
    // A date typed in now wins. Otherwise the move picks one.
    return form.followUpOn === (existing?.followUpOn ?? '') ? 'Picked for you when you save.' : undefined;
  }
  if (!form.followUpOn) return 'No reminder. Moving the card or logging a follow-up sets a new date.';
  return existing?.followUpStep ? STEP_HINTS[existing.followUpStep] : undefined;
}

function ImportBanner({
  source,
  missing,
  duplicate,
  applied,
  onAppliedChange,
}: {
  source?: string;
  missing: string[];
  duplicate?: { id: string; company: string; role: string };
  applied: boolean;
  onAppliedChange: (applied: boolean) => void;
}) {
  if (duplicate) {
    return (
      <div className="rounded-2xl border-2 border-gold-300 bg-gold-100/60 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="font-extrabold">You've already saved this job.</p>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {duplicate.role} at {duplicate.company} is on your board.{' '}
          <Link to={`/applications/${duplicate.id}`} className="font-extrabold text-brand-600 hover:underline dark:text-brand-300">
            Open it
          </Link>{' '}
          or save this one anyway.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border-2 border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-950/50">
      <BookmarkIcon className="shrink-0 text-xl text-brand-500" />
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-extrabold">Filled in from {source ?? 'the job page'}</p>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {missing.length > 0
            ? `Couldn't find the ${missing.join(' or ')}, so add ${missing.length === 1 ? 'it' : 'them'} below. Then check the rest and save.`
            : 'Check the details, then save.'}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={applied}
          onChange={(e) => onAppliedChange(e.target.checked)}
          className="size-4 accent-brand-500"
        />
        I already applied
      </label>
    </div>
  );
}
