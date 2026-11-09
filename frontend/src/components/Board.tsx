import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router';
import type { BoardQuery } from '../gql/graphql';
import { MoveJobApplicationMutation } from '../graphql/operations';
import { celebrateMove, showToast } from '../lib/celebrate';
import { shortInterviewTime } from '../lib/countdown';
import { formatDate } from '../lib/format';
import { playSound } from '../lib/sounds';
import { KIND_ACCENTS, WORK_ARRANGEMENT_LABELS } from '../lib/status';
import FollowUpTag from './FollowUpTag';
import { CalendarIcon, ColumnsIcon, MapPinIcon, PlusIcon, UsersIcon } from './icons';

type BoardStage = BoardQuery['stages'][number];
type BoardCard = BoardStage['jobApplications'][number];
type Column = { stage: BoardStage; cards: BoardCard[] };

type Drag = {
  card: BoardCard;
  fromStageId: string;
  fromIndex: number;
  /** The column under the pointer, or null when it's outside every column. */
  overStageId: string | null;
  /** Where the card would land, counting the other cards in that column. */
  overIndex: number;
  x: number;
  y: number;
  /** Where on the card it was grabbed, so it doesn't jump under the pointer. */
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

type Press = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  card: BoardCard;
  stageId: string;
  index: number;
  element: HTMLElement;
  timer?: number;
};

// Mouse drags start after a small movement. Touch drags start after a long
// press, so a normal swipe still scrolls the page.
const MOUSE_THRESHOLD = 5;
const TOUCH_SLOP = 8;
const LONG_PRESS_MS = 300;
const EDGE = 64;

function toColumns(stages: readonly BoardStage[]): Column[] {
  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({ stage, cards: [...stage.jobApplications] }));
}

export default function Board({ stages }: { stages: readonly BoardStage[] }) {
  const [columns, setColumns] = useState<Column[]>(() => toColumns(stages));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [moveApplication] = useMutation(MoveJobApplicationMutation);

  // Window listeners outlive a render, so they read the latest state through refs.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const dragRef = useRef<Drag | null>(null);
  const pressRef = useRef<Press | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const suppressClickRef = useRef(false);

  // Take fresh data from the server, except mid-drag.
  useEffect(() => {
    if (!dragRef.current) setColumns(toColumns(stages));
  }, [stages]);

  // Clean up if the board goes away mid-drag.
  useEffect(() => () => endPress(), []);

  function updateDrag(next: Drag | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function findTarget(x: number, y: number, draggedId: string) {
    const column = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-stage-id]');
    if (!column) return { overStageId: null, overIndex: 0 };

    const cards = [...column.querySelectorAll<HTMLElement>('[data-card-id]')].filter(
      (card) => card.dataset.cardId !== draggedId,
    );
    const index = cards.findIndex((card) => {
      const rect = card.getBoundingClientRect();
      return y < rect.top + rect.height / 2;
    });
    return { overStageId: column.dataset.stageId ?? null, overIndex: index === -1 ? cards.length : index };
  }

  function moveTo(x: number, y: number) {
    const current = dragRef.current;
    if (!current) return;
    updateDrag({ ...current, x, y, ...findTarget(x, y, current.card.id) });
  }

  function beginDrag() {
    const press = pressRef.current;
    if (!press) return;
    const rect = press.element.getBoundingClientRect();
    updateDrag({
      card: press.card,
      fromStageId: press.stageId,
      fromIndex: press.index,
      overStageId: press.stageId,
      overIndex: press.index,
      x: press.lastX,
      y: press.lastY,
      offsetX: press.lastX - rect.left,
      offsetY: press.lastY - rect.top,
      width: rect.width,
      height: rect.height,
    });
    document.body.classList.add('dragging');
    if (press.pointerType === 'touch') navigator.vibrate?.(12);
    frameRef.current = requestAnimationFrame(autoScroll);
  }

  // Scrolls the board sideways (and the page up or down) when a card is held near an edge.
  function autoScroll() {
    const current = dragRef.current;
    if (!current) return;
    let scrolled = false;

    const box = scrollRef.current;
    if (box) {
      const rect = box.getBoundingClientRect();
      if (current.x < rect.left + EDGE && box.scrollLeft > 0) {
        box.scrollLeft -= 14;
        scrolled = true;
      } else if (current.x > rect.right - EDGE && box.scrollLeft < box.scrollWidth - box.clientWidth) {
        box.scrollLeft += 14;
        scrolled = true;
      }
    }
    if (current.y < EDGE && window.scrollY > 0) {
      window.scrollBy(0, -12);
      scrolled = true;
    } else if (current.y > window.innerHeight - EDGE) {
      window.scrollBy(0, 12);
      scrolled = true;
    }

    if (scrolled) moveTo(current.x, current.y);
    frameRef.current = requestAnimationFrame(autoScroll);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>, card: BoardCard, stageId: string, index: number) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (pressRef.current) return;

    const element = event.currentTarget;
    // Touch pointers are captured by the element they start on. Release it so
    // move events report what's under the finger.
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);

    const press: Press = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      card,
      stageId,
      index,
      element,
    };
    if (event.pointerType !== 'mouse') {
      press.timer = window.setTimeout(beginDrag, LONG_PRESS_MS);
    }
    pressRef.current = press;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', cancelDrag);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchmove', blockScrollWhileDragging, { passive: false });
  }

  function handlePointerMove(event: PointerEvent) {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    press.lastX = event.clientX;
    press.lastY = event.clientY;

    if (dragRef.current) {
      moveTo(event.clientX, event.clientY);
      return;
    }

    const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
    if (press.pointerType === 'mouse') {
      if (distance > MOUSE_THRESHOLD) {
        beginDrag();
        moveTo(event.clientX, event.clientY);
      }
    } else if (distance > TOUCH_SLOP) {
      // The finger moved before the long press finished: it's a scroll, not a drag.
      endPress();
    }
  }

  function blockScrollWhileDragging(event: TouchEvent) {
    if (dragRef.current) event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') cancelDrag();
  }

  function handlePointerUp(event: PointerEvent) {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    const current = dragRef.current;
    endPress();
    if (current) drop(current);
  }

  function cancelDrag() {
    endPress();
  }

  function endPress() {
    const press = pressRef.current;
    if (press?.timer) window.clearTimeout(press.timer);
    pressRef.current = null;
    cancelAnimationFrame(frameRef.current);
    document.body.classList.remove('dragging');
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', cancelDrag);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('touchmove', blockScrollWhileDragging);
    if (dragRef.current) updateDrag(null);
  }

  function drop(finished: Drag) {
    // The click that follows a drag shouldn't open the card.
    suppressClickRef.current = true;
    setTimeout(() => (suppressClickRef.current = false), 0);

    const { overStageId, overIndex, card, fromStageId, fromIndex } = finished;
    if (!overStageId) return;
    if (overStageId === fromStageId && overIndex === fromIndex) return;

    const current = columnsRef.current;
    const fromColumn = current.find((column) => column.stage.id === fromStageId);
    const toColumn = current.find((column) => column.stage.id === overStageId);
    if (!fromColumn || !toColumn) return;

    // Update the board right away; the server catches up in the background,
    // including any new follow-up date.
    const kind = toColumn.stage.kind;
    const keepsFollowUp = kind === 'APPLIED' || kind === 'INTERVIEWING';
    const moved = keepsFollowUp
      ? { ...card, status: kind }
      : { ...card, status: kind, followUpOn: null, followUpDue: false };
    setColumns(
      current.map((column) => {
        const cards = column.cards.filter((c) => c.id !== card.id);
        if (column.stage.id === overStageId) cards.splice(overIndex, 0, moved);
        return { ...column, cards };
      }),
    );

    if (overStageId === fromStageId) {
      playSound('pop');
    } else {
      celebrateMove({
        from: { kind: fromColumn.stage.kind, position: fromColumn.stage.position },
        to: { kind: toColumn.stage.kind, position: toColumn.stage.position },
        origin: { x: finished.x, y: finished.y },
      });
    }

    moveApplication({
      variables: { id: card.id, stageId: overStageId, position: overIndex },
      refetchQueries: ['Board', 'Streak', 'Progress', 'Today'],
    }).catch(() => {
      showToast('gentle', "That move didn't save", 'Check that the Onward server is running, then try again.');
      setColumns(toColumns(stages));
    });
  }

  const dragging = drag !== null;

  return (
    <>
      <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex min-h-[60vh] gap-3">
          {columns.map((column) => (
            <section
              key={column.stage.id}
              data-stage-id={column.stage.id}
              aria-label={column.stage.name}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border-2 p-2 transition-colors ${
                dragging && drag.overStageId === column.stage.id
                  ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/40'
                  : 'border-transparent bg-stone-100 dark:bg-stone-900/70'
              }`}
            >
              <header className="flex items-center gap-2 px-2 pt-1 pb-2">
                <span className={`size-2.5 shrink-0 rounded-full ${KIND_ACCENTS[column.stage.kind]}`} aria-hidden="true" />
                <h2 className="min-w-0 flex-1 truncate font-extrabold">{column.stage.name}</h2>
                <span className="rounded-full bg-white px-2 text-sm font-extrabold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  {column.cards.filter((c) => !(dragging && c.id === drag.card.id)).length}
                </span>
                <Link
                  to={`/applications/new?stage=${column.stage.id}`}
                  aria-label={`Add an application to ${column.stage.name}`}
                  className="rounded-lg p-1 text-lg text-stone-400 hover:bg-white hover:text-brand-600 dark:hover:bg-stone-800 dark:hover:text-brand-300"
                >
                  <PlusIcon />
                </Link>
              </header>

              <ul className="flex flex-1 flex-col gap-2">
                {column.cards.map((card, index) => {
                  const isDragged = dragging && drag.card.id === card.id;
                  return (
                    <PlaceholderAware
                      key={card.id}
                      show={dragging && drag.overStageId === column.stage.id && drag.overIndex === visibleIndex(column, card, drag)}
                      height={drag?.height ?? 0}
                    >
                      <li data-card-id={card.id} className={isDragged ? 'hidden' : ''}>
                        <Link
                          to={`/applications/${card.id}`}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onPointerDown={(e) => handlePointerDown(e, card, column.stage.id, index)}
                          onContextMenu={(e) => {
                            // A long press on a phone would otherwise open the browser's link menu.
                            if (pressRef.current && pressRef.current.pointerType !== 'mouse') e.preventDefault();
                          }}
                          onClick={(e) => {
                            if (suppressClickRef.current) e.preventDefault();
                          }}
                          className="no-callout block cursor-grab touch-manipulation rounded-xl border-2 border-b-4 border-stone-200 bg-white p-3 transition select-none hover:border-brand-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:cursor-grabbing dark:border-stone-700 dark:bg-stone-900 dark:hover:border-brand-700"
                        >
                          <CardContent card={card} />
                        </Link>
                      </li>
                    </PlaceholderAware>
                  );
                })}
                {dragging && drag.overStageId === column.stage.id && drag.overIndex >= otherCount(column, drag) && (
                  <Placeholder height={drag.height} />
                )}
                {column.cards.length === 0 && !(dragging && drag.overStageId === column.stage.id) && (
                  <li className="rounded-xl border-2 border-dashed border-stone-300 px-3 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
                    Drop a card here
                  </li>
                )}
              </ul>
            </section>
          ))}

          <Link
            to="/columns"
            className="flex w-44 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 p-4 text-center font-bold text-stone-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-stone-700 dark:text-stone-400 dark:hover:text-brand-300"
          >
            <ColumnsIcon className="text-2xl" />
            Add or edit columns
          </Link>
        </div>
      </div>

      {drag && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-40 rotate-2 rounded-xl border-2 border-b-4 border-brand-300 bg-white p-3 shadow-xl shadow-brand-900/15 dark:border-brand-700 dark:bg-stone-900"
          style={{
            width: drag.width,
            transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px) rotate(2deg)`,
          }}
        >
          <CardContent card={drag.card} />
        </div>
      )}
    </>
  );
}

/** A card's index among the column's cards, not counting the one being dragged. */
function visibleIndex(column: Column, card: BoardCard, drag: Drag | null) {
  if (!drag) return -1;
  return column.cards.filter((c) => c.id !== drag.card.id).findIndex((c) => c.id === card.id);
}

function otherCount(column: Column, drag: Drag) {
  return column.cards.filter((c) => c.id !== drag.card.id).length;
}

/** Shows the drop placeholder just above a card when the dragged card would land there. */
function PlaceholderAware({ show, height, children }: { show: boolean; height: number; children: ReactNode }) {
  return (
    <>
      {show && <Placeholder height={height} />}
      {children}
    </>
  );
}

function Placeholder({ height }: { height: number }) {
  return (
    <li
      aria-hidden="true"
      className="rounded-xl border-2 border-dashed border-brand-400 bg-brand-100/60 dark:border-brand-600 dark:bg-brand-900/30"
      style={{ height }}
    />
  );
}

function CardContent({ card }: { card: BoardCard }) {
  const applied = formatDate(card.dateApplied);
  const where = [card.location, card.workArrangement ? WORK_ARRANGEMENT_LABELS[card.workArrangement] : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <p className="truncate font-extrabold">{card.company}</p>
      <p className="truncate text-sm text-stone-600 dark:text-stone-300">{card.role}</p>
      {(card.nextInterviewAt || card.followUpOn) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {card.nextInterviewAt && (
            <span className="inline-flex rounded-full bg-gold-100 px-2 py-0.5 text-xs font-extrabold text-gold-700 dark:bg-amber-900/40 dark:text-amber-200">
              {shortInterviewTime(card.nextInterviewAt)}
            </span>
          )}
          <FollowUpTag on={card.followUpOn} due={card.followUpDue} />
        </div>
      )}
      {(applied || where || card.contacts.length > 0) && (
        <div className="mt-2 space-y-0.5 text-xs text-stone-500 dark:text-stone-400">
          {applied && (
            <p className="flex items-center gap-1">
              <CalendarIcon className="shrink-0" /> {applied}
            </p>
          )}
          {where && (
            <p className="flex items-center gap-1 truncate">
              <MapPinIcon className="shrink-0" /> <span className="truncate">{where}</span>
            </p>
          )}
          {card.contacts.length > 0 && (
            <p className="flex items-center gap-1 truncate">
              <UsersIcon className="shrink-0" />
              <span className="truncate">{card.contacts.map((c) => c.name).join(', ')}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}
