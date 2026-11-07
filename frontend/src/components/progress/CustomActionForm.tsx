import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import type { ActivityCategory } from '../../gql/graphql';
import {
  CreateCustomActionMutation,
  CreateDailyGoalMutation,
  DeleteCustomActionMutation,
  UpdateCustomActionMutation,
} from '../../graphql/operations';
import { CATEGORY_LABELS } from '../../lib/activities';
import { Button, ErrorBanner, Field, Input, Select } from '../ui';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ActivityCategory[];
const refetchQueries = ['CustomActions', 'DailyGoals', 'Today', 'Progress'];

/** Adds a custom action, or edits or deletes one. */
export function CustomActionForm({
  action,
  onDone,
}: {
  action?: { id: string; name: string; category: ActivityCategory };
  onDone: (created: { id: string } | null, deleted?: boolean) => void;
}) {
  const [name, setName] = useState(action?.name ?? '');
  const [category, setCategory] = useState<ActivityCategory>(action?.category ?? 'NETWORKING');
  const [asGoal, setAsGoal] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [createAction, { loading: creating }] = useMutation(CreateCustomActionMutation, { refetchQueries });
  const [updateAction, { loading: updating }] = useMutation(UpdateCustomActionMutation, { refetchQueries });
  const [deleteAction] = useMutation(DeleteCustomActionMutation, { refetchQueries });
  const [createGoal] = useMutation(CreateDailyGoalMutation, { refetchQueries });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    try {
      if (action) {
        const { data } = await updateAction({ variables: { id: action.id, name, category } });
        const result = data?.updateCustomAction;
        if (result?.customAction) onDone(result.customAction);
        else setErrors(result?.errors.map((e) => e.message) ?? ['Something went wrong. Try again.']);
        return;
      }

      const { data } = await createAction({ variables: { name, category } });
      const result = data?.createCustomAction;
      if (!result?.customAction) {
        setErrors(result?.errors.map((e) => e.message) ?? ['Something went wrong. Try again.']);
        return;
      }
      if (asGoal) {
        await createGoal({ variables: { kind: 'CUSTOM', target: 1, weekdaysOnly: false, customActionId: result.customAction.id } });
      }
      onDone(result.customAction);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Something went wrong. Try again.']);
    }
  }

  async function handleDelete() {
    if (!action) return;
    if (!window.confirm(`Delete "${action.name}"? Times you've logged it stay in your history.`)) return;
    await deleteAction({ variables: { id: action.id } });
    onDone(null, true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl bg-stone-100 p-4 dark:bg-stone-800/60" noValidate>
      <p className="font-extrabold">{action ? 'Edit your action' : 'Add your own action'}</p>
      <ErrorBanner messages={errors} />
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label="What did you do?" htmlFor="custom-action-name">
          <Input
            id="custom-action-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Went to a meetup"
            maxLength={60}
            autoFocus
          />
        </Field>
        <Field label="Counts as" htmlFor="custom-action-category">
          <Select id="custom-action-category" value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)}>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {!action && (
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={asGoal} onChange={(e) => setAsGoal(e.target.checked)} className="size-4 accent-brand-500" />
          Make it a daily goal too
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={creating || updating || name.trim() === ''}>
          {action ? 'Save' : 'Add action'}
        </Button>
        <Button variant="ghost" onClick={() => onDone(null)}>
          Cancel
        </Button>
        {action && (
          <Button variant="ghostDanger" className="ml-auto" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
