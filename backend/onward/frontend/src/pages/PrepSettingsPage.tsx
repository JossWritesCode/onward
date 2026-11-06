import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import {
  CreateQuestionMutation,
  DeleteQuestionMutation,
  PrepSettingsQuery,
  UpdateChecklistTemplateMutation,
  UpdateQuestionMutation,
} from '../graphql/operations';
import { showToast } from '../lib/celebrate';
import EngineeringSettings from '../components/prep/EngineeringSettings';
import { ArrowLeftIcon, PlusIcon, TrashIcon, XIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Input, Spinner } from '../components/ui';

/** Edit the question bank and the checklist every new interview round starts with. */
export default function PrepSettingsPage() {
  const { data, loading, error } = useQuery(PrepSettingsQuery);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/prep"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> Interview prep
      </Link>
      <h1 className="mb-6 text-3xl font-black tracking-tight">Customize your prep</h1>

      {error && <ErrorBanner messages={[error.message]} />}
      {loading && !data && <Spinner />}
      {data && (
        <div className="space-y-8">
          <EngineeringSettings />
          <ChecklistTemplateEditor key={data.checklistTemplate.map((i) => i.id).join()} items={data.checklistTemplate.map((i) => i.text)} />
          <QuestionBank questions={data.questions} />
        </div>
      )}
    </div>
  );
}

function ChecklistTemplateEditor({ items: initial }: { items: string[] }) {
  const [items, setItems] = useState(initial.length > 0 ? initial : ['']);
  const [errors, setErrors] = useState<string[]>([]);
  const [save, { loading }] = useMutation(UpdateChecklistTemplateMutation, { refetchQueries: ['PrepSettings'] });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data } = await save({ variables: { items } });
    const result = data?.updateChecklistTemplate;
    if (result && result.errors.length === 0) {
      setErrors([]);
      showToast('celebrate', 'Checklist saved', 'New interview rounds will start with it.');
    } else {
      setErrors(result?.errors.map((e) => e.message) ?? ['Something went wrong. Try again.']);
    }
  }

  return (
    <section aria-labelledby="template-heading">
      <h2 id="template-heading" className="text-xl font-black">
        Interview checklist
      </h2>
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Every new interview round starts with these steps. Rounds that already exist keep their own.
      </p>
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-2" noValidate>
          <ErrorBanner messages={errors} />
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 text-right text-sm font-bold text-stone-400">{index + 1}</span>
              <label className="sr-only" htmlFor={`template-${index}`}>
                Step {index + 1}
              </label>
              <Input
                id={`template-${index}`}
                value={item}
                onChange={(e) => setItems((current) => current.map((v, i) => (i === index ? e.target.value : v)))}
                maxLength={200}
              />
              <button
                type="button"
                aria-label={`Remove step ${index + 1}`}
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              >
                <XIcon />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="secondary" onClick={() => setItems((current) => [...current, ''])}>
              <PlusIcon /> Add step
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save checklist'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

function QuestionBank({ questions }: { questions: readonly { id: string; prompt: string }[] }) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const refetchQueries = ['PrepSettings', 'Prep'];
  const [createQuestion, { loading }] = useMutation(CreateQuestionMutation, { refetchQueries });

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Type a question first.');
      return;
    }
    const { data } = await createQuestion({ variables: { prompt } });
    if (data?.createQuestion.question) {
      setPrompt('');
      setError(null);
    } else {
      setError(data?.createQuestion.errors.map((e) => e.message).join(' ') ?? 'Something went wrong.');
    }
  }

  return (
    <section aria-labelledby="questions-heading">
      <h2 id="questions-heading" className="text-xl font-black">
        Question bank
      </h2>
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Practice mode picks from these. Add ones from your field, or questions you've actually been asked.
      </p>
      <Card className="p-5">
        <form onSubmit={handleAdd} className="mb-4 flex gap-2" noValidate>
          <label className="sr-only" htmlFor="new-question">
            New question
          </label>
          <Input
            id="new-question"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError(null);
            }}
            placeholder="Walk me through how you'd design a URL shortener."
            maxLength={500}
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            <PlusIcon /> Add
          </Button>
        </form>
        {error && <p className="-mt-2 mb-3 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        <ul className="divide-y-2 divide-stone-100 dark:divide-stone-800">
          {questions.map((question) => (
            <QuestionRow key={question.id} question={question} />
          ))}
        </ul>
        {questions.length === 0 && (
          <p className="text-sm text-stone-500 dark:text-stone-400">No questions yet. Add one above.</p>
        )}
      </Card>
    </section>
  );
}

function QuestionRow({ question }: { question: { id: string; prompt: string } }) {
  const [prompt, setPrompt] = useState(question.prompt);
  const refetchQueries = ['PrepSettings', 'Prep'];
  const [updateQuestion] = useMutation(UpdateQuestionMutation, { refetchQueries });
  const [deleteQuestion] = useMutation(DeleteQuestionMutation, { refetchQueries });

  return (
    <li className="flex items-center gap-2 py-2">
      <label className="sr-only" htmlFor={`question-${question.id}`}>
        Question
      </label>
      <Input
        id={`question-${question.id}`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={() => {
          if (prompt.trim() && prompt.trim() !== question.prompt) void updateQuestion({ variables: { id: question.id, prompt } });
          else setPrompt(question.prompt);
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="border-transparent bg-transparent hover:border-stone-200 dark:border-transparent dark:bg-transparent"
      />
      <button
        type="button"
        aria-label={`Delete "${question.prompt}"`}
        onClick={() => deleteQuestion({ variables: { id: question.id } })}
        className="rounded-lg p-2 text-stone-300 hover:bg-rose-50 hover:text-rose-600 dark:text-stone-600 dark:hover:bg-rose-950/40"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
