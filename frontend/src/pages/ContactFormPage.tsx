import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router';
import type { ContactInput, ContactQuery as ContactQueryData } from '../gql/graphql';
import {
  ContactQuery,
  CreateContactMutation,
  DeleteContactMutation,
  JobApplicationsQuery,
  UpdateContactMutation,
} from '../graphql/operations';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { blankToNull, todayIso } from '../lib/format';
import LinkPicker from '../components/LinkPicker';
import { ArrowLeftIcon, TrashIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Spinner, Textarea } from '../components/ui';

type FormState = {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  lastContactedOn: string;
  notes: string;
  jobApplicationIds: string[];
};

const FIELDS = ['name', 'title', 'company', 'email', 'phone', 'linkedinUrl', 'lastContactedOn', 'notes'];

const EMPTY_FORM: FormState = {
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  lastContactedOn: '',
  notes: '',
  jobApplicationIds: [],
};

type ExistingContact = ContactQueryData['contact'];

function formFrom(contact: ExistingContact): FormState {
  return {
    name: contact.name,
    title: contact.title ?? '',
    company: contact.company ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    linkedinUrl: contact.linkedinUrl ?? '',
    lastContactedOn: contact.lastContactedOn ?? '',
    notes: contact.notes ?? '',
    jobApplicationIds: contact.jobApplications.map((application) => application.id),
  };
}

function inputFrom(form: FormState): ContactInput {
  return {
    name: form.name,
    title: blankToNull(form.title),
    company: blankToNull(form.company),
    email: blankToNull(form.email),
    phone: blankToNull(form.phone),
    linkedinUrl: blankToNull(form.linkedinUrl),
    lastContactedOn: form.lastContactedOn || null,
    notes: blankToNull(form.notes),
    jobApplicationIds: form.jobApplicationIds,
  };
}

/** Handles both /contacts/new and /contacts/:id. */
export default function ContactFormPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(ContactQuery, { variables: { id: id ?? '' }, skip: !id });

  if (!id) return <ContactForm key="new" />;
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBanner messages={[error?.message ?? "We couldn't find that contact."]} />;
  return <ContactForm key={id} existing={data.contact} />;
}

function ContactForm({ existing }: { existing?: ExistingContact }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(existing ? formFrom(existing) : EMPTY_FORM);
  const [errors, setErrors] = useState<UserError[]>([]);
  const { data: applicationsData } = useQuery(JobApplicationsQuery);

  const refetchQueries = ['Contacts', 'JobApplications', 'Board'];
  const [createContact, { loading: creating }] = useMutation(CreateContactMutation, { refetchQueries });
  const [updateContact, { loading: updating }] = useMutation(UpdateContactMutation, { refetchQueries });
  const [deleteContact, { loading: deleting }] = useMutation(DeleteContactMutation, { refetchQueries });
  const saving = creating || updating;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputFrom(form);
    try {
      const result = existing
        ? (await updateContact({ variables: { id: existing.id, input } })).data?.updateContact
        : (await createContact({ variables: { input } })).data?.createContact;

      if (result && result.errors.length === 0) {
        navigate('/contacts');
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
    if (!window.confirm(`Delete ${existing.name} from your contacts? This can't be undone.`)) return;
    await deleteContact({ variables: { id: existing.id } });
    navigate('/contacts');
  }

  const applicationOptions = (applicationsData?.jobApplications ?? []).map((application) => ({
    id: application.id,
    label: application.company,
    detail: application.role,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/contacts"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> All contacts
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">{existing ? existing.name : 'Add a contact'}</h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400">
          {existing
            ? [existing.title, existing.company].filter(Boolean).join(' at ') || 'Contact details'
            : 'A recruiter, a referral, someone you met at a meetup.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <ErrorBanner messages={generalErrors(errors, FIELDS)} />

        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required className="sm:col-span-2" error={fieldError(errors, 'name')}>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Priya Shah" required />
          </Field>
          <Field label="Title" htmlFor="title" error={fieldError(errors, 'title')}>
            <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Engineering Manager" />
          </Field>
          <Field label="Company" htmlFor="company" error={fieldError(errors, 'company')}>
            <Input id="company" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Brightline" />
          </Field>
          <Field label="Email" htmlFor="email" error={fieldError(errors, 'email')}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="priya@example.com"
            />
          </Field>
          <Field label="Phone" htmlFor="phone" error={fieldError(errors, 'phone')}>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="LinkedIn or website" htmlFor="linkedin-url" error={fieldError(errors, 'linkedinUrl')}>
            <Input
              id="linkedin-url"
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => set('linkedinUrl', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Last talked" htmlFor="last-contacted-on" error={fieldError(errors, 'lastContactedOn')}>
            <div className="flex gap-2">
              <Input
                id="last-contacted-on"
                type="date"
                value={form.lastContactedOn}
                onChange={(e) => set('lastContactedOn', e.target.value)}
              />
              <Button variant="secondary" className="shrink-0 px-3" onClick={() => set('lastContactedOn', todayIso())}>
                Today
              </Button>
            </div>
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <LinkPicker
            legend="Linked applications"
            options={applicationOptions}
            selected={form.jobApplicationIds}
            onChange={(ids) => set('jobApplicationIds', ids)}
            empty="No applications yet. Once you add some, you can link this person to them."
          />
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="How you met, what you talked about, what to follow up on…"
            />
          </Field>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Add contact'}
          </Button>
          <Link to="/contacts" className="px-3 py-2 font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400">
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
