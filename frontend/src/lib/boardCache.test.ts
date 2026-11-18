import { describe, expect, it } from 'vitest';
import { createCache } from '../apollo';
import { BoardQuery } from '../graphql/operations';
import type { BoardQuery as BoardData } from '../gql/graphql';
import { moveCardBetweenStages, placeMovedCard } from './boardCache';

type Stage = BoardData['stages'][number];
type Application = Stage['jobApplications'][number];

function application(id: string, company: string): Application {
  return {
    __typename: 'JobApplication',
    id,
    company,
    role: 'Developer',
    status: 'APPLIED',
    dateApplied: null,
    location: null,
    workArrangement: null,
    position: 0,
    updatedAt: '2026-11-18T12:00:00Z',
    nextInterviewAt: null,
    followUpOn: null,
    followUpDue: false,
    resume: null,
    contacts: [],
  } as Application;
}

function stage(id: string, name: string, position: number, jobApplications: Application[]): Stage {
  return { __typename: 'Stage', id, name, kind: 'APPLIED', position, jobApplications } as Stage;
}

const board = (): Stage[] => [
  stage('1', 'Saved', 0, [application('a', 'Maple & Co')]),
  stage('2', 'Applied', 1, [application('b', 'Brightline'), application('c', 'Northwind Labs')]),
  stage('3', 'Phone screen', 2, []),
];

const companies = (stages: readonly Stage[]) => stages.map((s) => s.jobApplications.map((a) => a.company));

describe('moveCardBetweenStages', () => {
  it('moves a card into another stage at the position it was dropped', () => {
    expect(companies(moveCardBetweenStages(board(), 'b', '3', 0))).toEqual([['Maple & Co'], ['Northwind Labs'], ['Brightline']]);
    expect(companies(moveCardBetweenStages(board(), 'a', '2', 1))).toEqual([[], ['Brightline', 'Maple & Co', 'Northwind Labs'], []]);
  });

  it('reorders within a stage, counting the position without the card', () => {
    expect(companies(moveCardBetweenStages(board(), 'b', '2', 1))).toEqual([['Maple & Co'], ['Northwind Labs', 'Brightline'], []]);
  });

  it('puts a card past the end at the end', () => {
    expect(companies(moveCardBetweenStages(board(), 'a', '2', 99))).toEqual([[], ['Brightline', 'Northwind Labs', 'Maple & Co'], []]);
  });

  it('leaves the board alone when the card or the stage is missing', () => {
    expect(companies(moveCardBetweenStages(board(), 'nope', '3', 0))).toEqual(companies(board()));
    expect(companies(moveCardBetweenStages(board(), 'b', 'nope', 0))).toEqual(companies(board()));
  });
});

describe('placeMovedCard', () => {
  it("moves the card in the cached board, keeping the new fields the server sent", () => {
    const cache = createCache();
    cache.writeQuery({ query: BoardQuery, data: { stages: board() } });

    // What the move mutation's reply does to the cache: the card changes, the
    // stage lists don't.
    cache.modify({ id: cache.identify({ __typename: 'JobApplication', id: 'b' }), fields: { followUpOn: () => '2026-11-19' } });
    expect(companies(cache.readQuery({ query: BoardQuery })!.stages)[1]).toContain('Brightline');

    placeMovedCard(cache, 'b', '3', 0);

    const stages = cache.readQuery({ query: BoardQuery })!.stages;
    expect(companies(stages)).toEqual([['Maple & Co'], ['Northwind Labs'], ['Brightline']]);
    expect(stages[2].jobApplications[0].followUpOn).toBe('2026-11-19');
  });

  it('does nothing without a board in the cache or a stage to move to', () => {
    const cache = createCache();
    expect(() => placeMovedCard(cache, 'b', '3', 0)).not.toThrow();
    cache.writeQuery({ query: BoardQuery, data: { stages: board() } });
    placeMovedCard(cache, 'b', undefined, 0);
    expect(companies(cache.readQuery({ query: BoardQuery })!.stages)).toEqual(companies(board()));
  });
});
