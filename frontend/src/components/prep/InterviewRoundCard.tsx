import { useState, type KeyboardEvent } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router';
import {
  AddChecklistItemMutation,
  DeleteChecklistItemMutation,
  SetChecklistItemDoneMutation,
  UpdateInterviewRoundMutation,
} from '../../graphql/operations';
import { celebratePrepped } from '../../lib/celebrate';
import { describeInterviewTime, toDateTimeLocal } from '../../lib/countdown';
import { CalendarIcon, CheckIcon, ClockIcon, PlusIcon, XIcon } from '../icons';
import { Card, Input } from '../ui';

export type Round = {
  id: string;
  name: string;
  scheduledAt?: string | null;
  prepped: boolean;
  checklistItems: readonly { id: string; text: string; done: boolean }[];
  jobApplication?: { id: string; company: string; role: string };
};

const refetchQueries = ['Streak', 'Progress', 'Board'];

/** One interview round: when it is, and its prep checklist. */
export default function InterviewRoundCard({
  round,
  company,
  wide = false,
  next = false,
}: {
  round: Round;
  company: string;
  /** Spread out across a full row, for when it's the only interview. */
  wide?: boolean;
  /** The soonest scheduled interview, marked so it's easy to spot. */
  next?: boolean;
}) {
  const [newItem, setNewItem] = useState('');
  const [setDone] = useMutation(SetChecklistItemDoneMutation, { refetchQueries });
  const [updateRound] = useMutation(UpdateInterviewRoundMutation, { refetchQueries: ['Board', 'Prep'] });
  const [addItem] = useMutation(AddChecklistItemMutation);
  const [deleteItem] = useMutation(DeleteChecklistItemMutation, { refetchQueries });

  const items = round.checklistItems;
  const doneCount = items.filter((item) => item.done).length;
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);
  const soon = round.scheduledAt ? describeInterviewTime(round.scheduledAt) : null;
  const stepsLabel = `${doneCount} of ${items.length} ${items.length === 1 ? 'step' : 'steps'} complete`;

  async function toggle(id: string, done: boolean) {
    const { data } = await setDone({ variables: { id, done } });
    if (data?.setChecklistItemDone.justPrepped) celebratePrepped(company);
  }

  async function add() {
    const text = newItem.trim();
    if (!text) return;
    await addItem({ variables: { interviewRoundId: round.id, text } });
    setNewItem('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void add();
    }
  }

  const details = (
    <div className="min-w-0">
      {next && (
        <p className="mb-2 text-[13px]/[18px] font-semibold tracking-wide text-accent uppercase">Next interview</p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {round.jobApplication ? (
            <Link
              to={`/applications/${round.jobApplication.id}`}
              className="block truncate text-lg/6 font-semibold hover:text-link"
            >
              {round.jobApplication.company}
            </Link>
          ) : null}
          <p className={round.jobApplication ? 'mt-0.5 text-sm/5 text-muted' : 'text-lg/6 font-semibold'}>
            {round.name}
            {round.jobApplication && ` · ${round.jobApplication.role}`}
          </p>
        </div>
        {round.prepped ? (
          <span className="inline-flex items-center gap-1 text-[13px]/[18px] font-semibold text-done">
            <CheckIcon /> Prepped
          </span>
        ) : (
          soon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-2.5 py-0.5 text-[13px]/[18px] font-semibold text-accent">
              <ClockIcon className="shrink-0" /> {soon}
            </span>
          )
        )}
      </div>

      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm/5 text-muted">
        <CalendarIcon />
        <span className="font-medium">When</span>
        <input
          type="datetime-local"
          value={toDateTimeLocal(round.scheduledAt)}
          onChange={(e) =>
            updateRound({
              variables: { id: round.id, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null },
            })
          }
          className="min-h-10 rounded-lg border border-control bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-focus focus:ring-3 focus:ring-focus/25 focus:outline-none"
        />
      </label>
    </div>
  );

  const checklist = (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${round.name} prep progress`}
          aria-valuetext={stepsLabel}
        >
          <div
            className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-done' : 'bg-link'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[13px]/[18px] font-medium text-muted tabular-nums">{stepsLabel}</span>
      </div>

      <ul className="mt-3 space-y-0.5">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <label className="flex min-h-9 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-stone-200/50 dark:hover:bg-stone-800">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => toggle(item.id, e.target.checked)}
                className="size-[18px] shrink-0 accent-action"
              />
              <span className={item.done ? 'text-muted line-through' : ''}>{item.text}</span>
            </label>
            <button
              type="button"
              aria-label={`Remove "${item.text}"`}
              onClick={() => deleteItem({ variables: { id: item.id } })}
              className="rounded-md p-1.5 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-rose-700 focus-visible:opacity-100 dark:hover:text-rose-400"
            >
              <XIcon />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <label className="sr-only" htmlFor={`new-item-${round.id}`}>
          Add a step to this checklist
        </label>
        <Input
          id={`new-item-${round.id}`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a step"
          className="py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={add}
          aria-label="Add step"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-link hover:bg-stone-200/60 dark:hover:bg-stone-800"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );

  // On its own, an interview gets the whole row: details on the left, checklist on the right.
  return (
    <Card className={`p-6 ${next ? 'border-l-4 border-l-accent' : ''} ${wide ? 'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10' : ''}`}>
      {details}
      <div className={wide ? 'mt-5 lg:mt-0' : 'mt-5'}>{checklist}</div>
    </Card>
  );
}
