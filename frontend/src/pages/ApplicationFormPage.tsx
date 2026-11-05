import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router';
import type {
  JobApplicationInput,
  JobApplicationQuery as JobApplicationQueryData,
  JobApplicationStatus,
  WorkArrangement,
} from '../gql/graphql';
import {
  ContactsQuery,
  CreateJobApplicationMutation,
  DeleteJobApplicationMutation,
  JobApplicationQuery,
  UpdateJobApplicationMutation,
} from '../graphql/operations';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { blankToNull, formatDate } from '../lib/format';
import { STATUSES, STATUS_LABELS, WORK_ARRANGEMENTS, WORK_ARRANGEMENT_LABELS } from '../lib/status';
import LinkPicker from '../components/LinkPicker';
import { ArrowLeftIcon, ExternalLinkIcon, TrashIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Select, Spinner, Textarea } from '../components/ui';

type FormState = {
  company: string;
  role: string;
  status: JobApplicationStatus;
  dateApplied: string;
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
  'status',
  'dateApplied',
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
  status: 'SAVED',
  dateApplied: '',
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
    status: application.status,
    dateApplied: application.dateApplied ?? '',
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
    status: form.status,
    dateApplied: form.dateApplied || null,
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

function ApplicationForm({ existing }: { existing?: ExistingApplication }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(existing ? formFrom(existing) : EMPTY_FORM);
  const [errors, setErrors] = useState<UserError[]>([]);
  const { data: contactsData } = useQuery(ContactsQuery);

  const refetchQueries = ['JobApplications', 'Contacts'];
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

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <ErrorBanner messages={generalErrors(errors, FIELDS)} />

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
          <Field label="Status" htmlFor="status" error={fieldError(errors, 'status')}>
            <Select id="status" value={form.status} onChange={(e) => set('status', e.target.value as JobApplicationStatus)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Date applied"
            htmlFor="date-applied"
            hint={form.status === 'APPLIED' && !form.dateApplied ? 'Leave blank to use today.' : undefined}
            error={fieldError(errors, 'dateApplied')}
          >
            <Input
              id="date-applied"
              type="date"
              value={form.dateApplied}
              onChange={(e) => set('dateApplied', e.target.value)}
            />
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
          <Field
            label="Resume version"
            htmlFor="resume-version"
            hint="Which resume you sent, so you can tell what works."
            error={fieldError(errors, 'resumeVersion')}
          >
            <Input
              id="resume-version"
              value={form.resumeVersion}
              onChange={(e) => set('resumeVersion', e.target.value)}
              placeholder="Frontend v3"
            />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <LinkPicker
            legend="Contacts"
            options={contactOptions}
            selected={form.contactIds}
            onChange={(ids) => set('contactIds', ids)}
            empty={
              <>
                No contacts yet.{' '}
                <Link to="/contacts/new" className="font-bold text-brand-600 hover:underline dark:text-brand-300">
                  Add someone you know
                </Link>{' '}
                and link them here.
              </>
            }
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
