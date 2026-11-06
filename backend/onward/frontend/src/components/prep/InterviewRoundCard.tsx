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
import { CalendarIcon, CheckIcon, PlusIcon, XIcon } from '../icons';
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
export default function InterviewRoundCard({ round, company }: { round: Round; company: string }) {
  const [newItem, setNewItem] = useState('');
  const [setDone] = useMutation(SetChecklistItemDoneMutation, { refetchQueries });
  const [updateRound] = useMutation(UpdateInterviewRoundMutation, { refetchQueries: ['Board', 'Prep'] });
  const [addItem] = useMutation(AddChecklistItemMutation);
  const [deleteItem] = useMutation(DeleteChecklistItemMutation, { refetchQueries });

  const items = round.checklistItems;
  const doneCount = items.filter((item) => item.done).length;
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);
  const soon = round.scheduledAt ? describeInterviewTime(round.scheduledAt) : null;

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

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {round.jobApplication ? (
            <Link
              to={`/applications/${round.jobApplication.id}`}
              className="block truncate text-lg font-extrabold hover:text-brand-600 dark:hover:text-brand-300"
            >
              {round.jobApplication.company}
            </Link>
          ) : null}
          <p className={round.jobApplication ? 'text-sm text-stone-500 dark:text-stone-400' : 'text-lg font-extrabold'}>
            {round.name}
            {round.jobApplication && ` · ${round.jobApplication.role}`}
          </p>
        </div>
        {round.prepped ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <CheckIcon /> Prepped
          </span>
        ) : (
          soon && (
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-extrabold text-gold-700 dark:bg-amber-900/40 dark:text-amber-200">
              {soon}
            </span>
          )
        )}
      </div>

      <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <CalendarIcon className="text-stone-400" />
        <span className="font-bold">When</span>
        <input
          type="datetime-local"
          value={toDateTimeLocal(round.scheduledAt)}
          onChange={(e) =>
            updateRound({
              variables: { id: round.id, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null },
            })
          }
          className="rounded-lg border-2 border-stone-200 bg-white px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-900"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${round.name} prep progress`}
        >
          <div
            className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-extrabold text-stone-500 tabular-nums">
          {doneCount}/{items.length}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-stone-100 dark:hover:bg-stone-800/60">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => toggle(item.id, e.target.checked)}
                className="size-5 shrink-0 accent-brand-500"
              />
              <span className={item.done ? 'text-stone-400 line-through' : ''}>{item.text}</span>
            </label>
            <button
              type="button"
              aria-label={`Remove "${item.text}"`}
              onClick={() => deleteItem({ variables: { id: item.id } })}
              className="rounded-md p-1 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 focus-visible:opacity-100 dark:text-stone-600"
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
          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
        >
          <PlusIcon />
        </button>
      </div>
    </Card>
  );
}
