import type { ApolloCache } from '@apollo/client';
import { BoardQuery } from '../graphql/operations';
import type { BoardQuery as BoardData } from '../gql/graphql';

type BoardStage = BoardData['stages'][number];

/**
 * The board's stages with one card moved into another stage's list, at
 * `position` in that list (counted without the card itself). The card keeps
 * whatever fields it already has. Returns the stages unchanged if the card or
 * the stage isn't there.
 */
export function moveCardBetweenStages(stages: readonly BoardStage[], cardId: string, toStageId: string, position: number): BoardStage[] {
  const card = stages.flatMap((stage) => stage.jobApplications).find((application) => application.id === cardId);
  if (!card || !stages.some((stage) => stage.id === toStageId)) return [...stages];

  return stages.map((stage) => {
    const jobApplications = stage.jobApplications.filter((application) => application.id !== cardId);
    if (stage.id === toStageId) {
      jobApplications.splice(Math.max(0, Math.min(position, jobApplications.length)), 0, card);
    }
    return { ...stage, jobApplications };
  });
}

/**
 * After a move is saved, put the card in its new stage's list in Apollo's cache.
 *
 * The server's reply updates the card itself (its status and follow-up date)
 * straight away, but each stage's list of cards only changes when the Board
 * query is fetched again. Until then the board would draw the card back in its
 * old column, with its new date, and then jump it forward when the refetch
 * arrives. Moving it here keeps the cache in step with what the board shows.
 */
export function placeMovedCard(cache: ApolloCache<unknown>, cardId: string, toStageId: string | undefined, position: number) {
  if (!toStageId) return;
  const board = cache.readQuery({ query: BoardQuery });
  if (!board) return;
  cache.writeQuery({ query: BoardQuery, data: { ...board, stages: moveCardBetweenStages(board.stages, cardId, toStageId, position) } });
}
