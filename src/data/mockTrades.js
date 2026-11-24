const now = Date.now();
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export const INITIAL_TRADES = [
  {
    id: 'tr_ornella_1',
    senderId: 'u2',
    receiverId: 'u1',
    requestedPuzzleId: 'p1', // Debe existir en INITIAL_PUZZLES
    offeredPuzzleId: 'p3',   // Debe existir en INITIAL_PUZZLES
    status: 'pending',       // 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed'
    message: '¿Te copa cambiarlo este finde?',
    createdAt: now - 6 * 60 * 60 * 1000,
    expiresAt: now - 6 * 60 * 60 * 1000 + FORTY_EIGHT_HOURS,
    chatThreadId: 'thread_tr_ornella_1',
    confirmations: {
      u2: false,
      u1: false,
    },
  },
];