import { describe, expect, it } from 'vitest';
import { undoneMessage } from './undo';

describe('undoneMessage', () => {
  it('says nothing when the move took nothing back', () => {
    expect(undoneMessage([])).toBeNull();
    expect(undoneMessage(null)).toBeNull();
    expect(undoneMessage(undefined)).toBeNull();
  });

  it.each([
    ['APPLICATION_SENT', "That won't count as an application."],
    ['INTERVIEW', "That won't count as an interview."],
    ['OFFER', "That won't count as an offer."],
    ['REJECTION', "That won't count as a closure."],
  ])('names what %s took back', (kind, body) => {
    expect(undoneMessage([kind])).toEqual({ title: 'Moved back', body });
  });

  it('lists several in the order they happen, however they arrive', () => {
    expect(undoneMessage(['INTERVIEW', 'APPLICATION_SENT'])?.body).toBe("That won't count as an application or an interview.");
    expect(undoneMessage(['OFFER', 'APPLICATION_SENT', 'INTERVIEW'])?.body).toBe(
      "That won't count as an application, an interview or an offer.",
    );
  });

  it('ignores kinds the board never records', () => {
    expect(undoneMessage(['COFFEE_CHAT'])).toBeNull();
  });
});
