import { describe, expect, it } from 'vitest';
import { buildAcceptedTradeProposal } from './tradeHelpers';
import { evaluateUserBadges } from './badgeHelpers';

describe('trade helpers', () => {
  it('builds an accepted proposal with participant and puzzle details', () => {
    const proposal = buildAcceptedTradeProposal(
      {
        id: 'trade-1',
        senderId: 'user-a',
        receiverId: 'user-b',
        requestedPuzzleId: 'puzzle-a',
        offeredPuzzleId: 'puzzle-b',
        message: '¿Intercambiamos?',
      },
      [
        { id: 'puzzle-a', title: 'Azul', userId: 'user-b' },
        { id: 'puzzle-b', title: 'Rojo', userId: 'user-a' },
      ],
      [
        { id: 'user-a', name: 'Ana' },
        { id: 'user-b', name: 'Beto' },
      ],
      { id: 'user-b', name: 'Beto' }
    );

    expect(proposal.senderId).toBe('user-a');
    expect(proposal.receiverId).toBe('user-b');
    expect(proposal.puzzleTargetTitle).toBe('Azul');
    expect(proposal.puzzleOfferedTitle).toBe('Rojo');
    expect(proposal.messages[0].text).toBe('¿Intercambiamos?');
  });

  it('keeps a trade out of the proposal when it is missing', () => {
    expect(buildAcceptedTradeProposal(null)).toBeNull();
  });
});

describe('badge helpers', () => {
  it('awards gallery and first-swap badges', () => {
    const badges = evaluateUserBadges({
      user: { rating: 4.9 },
      userId: 'user-a',
      completedPuzzles: [{ id: 'cp-1', userId: 'user-a' }],
      trades: [{ id: 'trade-1', status: 'completed', senderId: 'user-a', receiverId: 'user-b' }],
      proposals: [],
    });

    expect(badges).toContain('gallery-keeper');
    expect(badges).toContain('first-swap');
    expect(badges).toContain('trusted-neighbor');
  });

  it('does not count the same trade twice', () => {
    const badges = evaluateUserBadges({
      userId: 'user-a',
      trades: [{ id: 'trade-1', status: 'completed', senderId: 'user-a' }],
      proposals: [{ tradeId: 'trade-1', status: 'completed', senderId: 'user-a' }],
    });

    expect(badges.filter((badge) => badge === 'first-swap')).toHaveLength(1);
  });
});
