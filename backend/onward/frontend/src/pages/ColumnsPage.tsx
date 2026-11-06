import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import type { BoardQuery as BoardQueryData } from '../gql/graphql';
import {
  BoardQuery,
  CreateStageMutation,
  DeleteStageMutation,
  ReorderStagesMutation,
  UpdateStageMutation,
} from '../graphql/operations';
import type { UserError } from '../lib/errors';
import { KIND_ACCENTS, KIND_HELP, STATUSES, STATUS_LABELS, type StageKind } from '../lib/status';
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../components/icons';
import { Button, Card, ErrorBanner, Field, Input, Select, Spinner } from '../components/ui';

type Stage = BoardQueryData['stages'][number];

export default function ColumnsPage() {
  const { data, loading, error } = useQuery(BoardQuery);
  const [reorder] = useMutation(ReorderStagesMutation, { refetchQueries: ['Board', 'Stages'] });
  const stages = [...(data?.stages ?? [])].sort((a, b) => a.position - b.position);

  function move(index: number, direction: -1 | 1) {
    const ids = stages.map((stage) => stage.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void reorder({ variables: { ids } });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/applications"
        className="mb-4 inline-flex items-center gap-1.5 font-bold text-stone-500 hover:text-brand-600 dark:text-stone-400"
      >
        <ArrowLeftIcon /> Back to your board
      </Link>

      <h1 className="text-3xl font-black tracking-tight">Your board's columns</h1>
      <p className="mt-1 mb-6 text-stone-500 dark:text-stone-400">
        Name them however you like. Each column has a type, so Onward knows what moving a card there means, like
        counting every interview round as interviewing. Top to bottom here is left to right on your board.
      </p>

      {error && <ErrorBanner messages={[error.message]} />}
      {loading && !data && <Spinner />}

      {data && (
        <div className="space-y-5">
          <ul className="space-y-2">
            {stages.map((stage, index) => (
              <li key={stage.id}>
                <StageRow
                  stage={stage}
                  isFirst={index === 0}
                  isLast={index === stages.length - 1}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                />
              </li>
            ))}
          </ul>

          <AddStageForm />
        </div>
      )}
    </div>
  );
}

function StageRow({
  stage,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  stage: Stage;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [errors, setErrors] = useState<readonly UserError[]>([]);
  const refetchQueries = ['Board', 'Stages'];
  const [updateStage] = useMutation(UpdateStageMutation, { refetchQueries });
  const [deleteStage, { loading: deleting }] = useMutation(DeleteStageMutation, { refetchQueries });
  const count = stage.jobApplications.length;

  async function save(input: { name?: string; kind?: StageKind }) {
    const { data } = await updateStage({ variables: { id: stage.id, input } });
    const result = data?.updateStage;
    setErrors(result?.errors ?? []);
    if (result?.errors.length && input.name !== undefined) setName(stage.name);
  }

  async function handleDelete() {
    if (count > 0) {
      setErrors([{ message: `Move the ${count === 1 ? 'card' : `${count} cards`} out of ${stage.name} before deleting it.` }]);
      return;
    }
    if (!window.confirm(`Delete the ${stage.name} column?`)) return;
    const { data } = await deleteStage({ variables: { id: stage.id } });
    setErrors(data?.deleteStage.errors ?? []);
  }

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ${stage.name} left`}
            className="rounded-md p-0.5 text-stone-400 hover:bg-stone-100 hover:text-brand-600 disabled:opacity-30 dark:hover:bg-stone-800"
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ${stage.name} right`}
            className="rounded-md p-0.5 text-stone-400 hover:bg-stone-100 hover:text-brand-600 disabled:opacity-30 dark:hover:bg-stone-800"
          >
            <ChevronDownIcon />
          </button>
        </div>

        <span className={`size-3 shrink-0 rounded-full ${KIND_ACCENTS[stage.kind]}`} aria-hidden="true" />

        <label className="sr-only" htmlFor={`stage-name-${stage.id}`}>
          Column name
        </label>
        <Input
          id={`stage-name-${stage.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() !== stage.name && save({ name })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 font-bold"
        />

        <label className="sr-only" htmlFor={`stage-kind-${stage.id}`}>
          Column type
        </label>
        <Select
          id={`stage-kind-${stage.id}`}
          value={stage.kind}
          onChange={(e) => save({ kind: e.target.value as StageKind })}
          className="w-full sm:w-40"
        >
          {STATUSES.map((kind) => (
            <option key={kind} value={kind}>
              {STATUS_LABELS[kind]}
            </option>
          ))}
        </Select>

        <span className="w-16 shrink-0 text-right text-sm text-stone-500 dark:text-stone-400">
          {count} {count === 1 ? 'card' : 'cards'}
        </span>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${stage.name}`}
          className="rounded-lg p-2 text-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
        >
          <TrashIcon />
        </button>
      </div>
      {errors.length > 0 && (
        <p role="alert" className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {errors.map((error) => error.message).join(' ')}
        </p>
      )}
    </Card>
  );
}

function AddStageForm() {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<StageKind>('INTERVIEWING');
  const [errors, setErrors] = useState<readonly UserError[]>([]);
  const [createStage, { loading }] = useMutation(CreateStageMutation, { refetchQueries: ['Board', 'Stages'] });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data } = await createStage({ variables: { input: { name, kind } } });
    const result = data?.createStage;
    if (result?.stage) {
      setName('');
      setErrors([]);
    } else {
      setErrors(result?.errors ?? [{ message: 'Something went wrong. Try again.' }]);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-lg font-extrabold">Add a column</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end" noValidate>
        <Field label="Name" htmlFor="new-stage-name">
          <Input
            id="new-stage-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Final round"
          />
        </Field>
        <Field label="Type" htmlFor="new-stage-kind">
          <Select id="new-stage-kind" value={kind} onChange={(e) => setKind(e.target.value as StageKind)}>
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={loading}>
          <PlusIcon /> Add
        </Button>
        <p className="text-sm text-stone-500 sm:col-span-3 dark:text-stone-400">
          <span className="font-bold">{STATUS_LABELS[kind]}:</span> {KIND_HELP[kind]}. New columns go on the right.
        </p>
      </form>
      {errors.length > 0 && (
        <div className="mt-3">
          <ErrorBanner messages={errors.map((error) => error.message)} />
        </div>
      )}
    </Card>
  );
}
