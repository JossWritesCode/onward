import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router';
import type { StoryQuery as StoryQueryData } from '../gql/graphql';
import { CreateStoryMutation, DeleteStoryMutation, StoryQuery, UpdateStoryMutation } from '../graphql/operations';
import { fieldError, generalErrors, type UserError } from '../lib/errors';
import { ArrowLeftIcon, TrashIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Spinner, Textarea } from '../components/ui';

type Existing = StoryQueryData['story'];

const STAR = [
  { key: 'situation', label: 'Situation', hint: 'Where were you, and what was going on?' },
  { key: 'task', label: 'Task', hint: 'What were you responsible for, or what needed to happen?' },
  { key: 'action', label: 'Action', hint: 'What did you do? Say "I," not "we."' },
  { key: 'result', label: 'Result', hint: 'What happened? Numbers help, and so does what you learned.' },
] as const;

const FIELDS = ['title', 'situation', 'task', 'action', 'result', 'tags'];

/** Handles both /prep/stories/new and /prep/stories/:id. */
export default function StoryFormPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(StoryQuery, { variables: { id: id ?? '' }, skip: !id });

  if (!id) return <StoryForm key="new" />;
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBanner messages={[error?.message ?? "We couldn't find that story."]} />;
  return <StoryForm key={id} existing={data.story} />;
}

function StoryForm({ existing }: { existing?: Existing }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [parts, setParts] = useState({
    situation: existing?.situation ?? '',
    task: existing?.task ?? '',
    action: existing?.action ?? '',
    result: existing?.result ?? '',
  });
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [errors, setErrors] = useState<UserError[]>([]);

  const refetchQueries = ['Prep'];
  const [createStory, { loading: creating }] = useMutation(CreateStoryMutation, { refetchQueries });
  const [updateStory, { loading: updating }] = useMutation(UpdateStoryMutation, { refetchQueries });
  const [deleteStory] = useMutation(DeleteStoryMutation, { refetchQueries });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      title,
      ...parts,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    try {
      const result = existing
        ? (await updateStory({ variables: { id: existing.id, input } })).data?.updateStory
        : (await createStory({ variables: { input } })).data?.createStory;
      if (result && result.errors.length === 0) navigate('/prep');
      else setErrors(result?.errors ?? [{ message: 'Something went wrong. Try again.' }]);
    } catch (caught) {
      setErrors([{ message: caught instanceof Error ? caught.message : 'Something went wrong. Try again.' }]);
    }
  }

  async function handleDelete() {
    if (!existing || !window.confirm(`Delete "${existing.title}"? This can't be undone.`)) return;
    await deleteStory({ variables: { id: existing.id } });
    navigate('/prep');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/prep"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> Interview prep
      </Link>
      <h1 className="text-3xl font-black tracking-tight">{existing ? existing.title : 'Add a story'}</h1>
      <p className="mt-1 mb-6 text-stone-500 dark:text-stone-400">
        Jot down notes, not a script. You'll tell it in your own words each time.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <ErrorBanner messages={generalErrors(errors, FIELDS)} />

        <Card className="space-y-4 p-5">
          <Field label="Title" htmlFor="story-title" required error={fieldError(errors, 'title')}>
            <Input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rescued the product launch"
              required
            />
          </Field>
          <Field
            label="Tags"
            htmlFor="story-tags"
            hint="Comma-separated, like leadership, conflict, failure."
            error={fieldError(errors, 'tags')}
          >
            <Input id="story-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="leadership, deadlines" />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          {STAR.map((part) => (
            <Field key={part.key} label={part.label} htmlFor={`story-${part.key}`} hint={part.hint} error={fieldError(errors, part.key)}>
              <Textarea
                id={`story-${part.key}`}
                rows={3}
                value={parts[part.key]}
                onChange={(e) => setParts((current) => ({ ...current, [part.key]: e.target.value }))}
              />
            </Field>
          ))}
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={creating || updating}>
            {creating || updating ? 'Saving…' : existing ? 'Save changes' : 'Add story'}
          </Button>
          <Link to="/prep" className="px-3 py-2 font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400">
            Cancel
          </Link>
          {existing && (
            <Button variant="ghostDanger" className="ml-auto" onClick={handleDelete}>
              <TrashIcon /> Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
