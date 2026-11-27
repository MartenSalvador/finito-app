export function buildAcceptedTradeProposal(
  acceptedTrade,
  puzzles = [],
  users = [],
  currentUser = null
) {
  if (!acceptedTrade) return null;

  const safePuzzles = Array.isArray(puzzles) ? puzzles : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const requestedPuzzleId =
    acceptedTrade.requestedPuzzleId ??
    acceptedTrade.puzzleTargetId ??
    acceptedTrade.requestedPuzzle?.id ??
    null;

  const offeredPuzzleId =
    acceptedTrade.offeredPuzzleId ??
    acceptedTrade.puzzleOfferedId ??
    acceptedTrade.offeredPuzzle?.id ??
    null;

  const requestedPuzzle =
    safePuzzles.find(
      (p) => requestedPuzzleId && String(p.id) === String(requestedPuzzleId)
    ) ||
    acceptedTrade.requestedPuzzle ||
    null;

  const offeredPuzzle =
    safePuzzles.find(
      (p) => offeredPuzzleId && String(p.id) === String(offeredPuzzleId)
    ) ||
    acceptedTrade.offeredPuzzle ||
    null;

  const rawSenderId =
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.id : null) ??
    acceptedTrade.senderId ??
    acceptedTrade.fromId ??
    requestedPuzzle?.userId ??
    requestedPuzzle?.ownerId ??
    null;

  const rawSenderName =
    (typeof acceptedTrade.sender === 'string' ? acceptedTrade.sender : null) ??
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.name : null) ??
    acceptedTrade.senderName ??
    acceptedTrade.fromName ??
    acceptedTrade.userName ??
    null;

  const matchedSender = safeUsers.find(
    (u) =>
      (rawSenderId && String(u.id) === String(rawSenderId)) ||
      (!rawSenderId &&
        rawSenderName &&
        u.name?.trim().toLowerCase() === rawSenderName.trim().toLowerCase())
  );

  const senderId = rawSenderId
    ? String(rawSenderId)
    : matchedSender?.id
      ? String(matchedSender.id)
      : null;

  const senderName =
    rawSenderName ||
    matchedSender?.name ||
    (senderId && currentUser?.id && String(currentUser.id) === senderId
      ? currentUser?.name
      : null) ||
    'Usuario';

  const senderAvatar =
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.avatar : null) ||
    acceptedTrade.senderAvatar ||
    matchedSender?.avatar ||
    matchedSender?.photo ||
    '';

  const rawReceiverId =
    acceptedTrade.receiverId ??
    acceptedTrade.recipientId ??
    acceptedTrade.targetUserId ??
    acceptedTrade.ownerId ??
    offeredPuzzle?.userId ??
    offeredPuzzle?.ownerId ??
    currentUser?.id ??
    null;

  const matchedReceiver = safeUsers.find(
    (u) => rawReceiverId && String(u.id) === String(rawReceiverId)
  );

  const receiverId = rawReceiverId
    ? String(rawReceiverId)
    : matchedReceiver?.id
      ? String(matchedReceiver.id)
      : null;

  const receiverName =
    acceptedTrade.receiverName ||
    acceptedTrade.recipientName ||
    acceptedTrade.targetOwnerName ||
    matchedReceiver?.name ||
    (receiverId && currentUser?.id && String(currentUser.id) === receiverId
      ? currentUser?.name
      : null) ||
    'Usuario';

  const receiverAvatar =
    acceptedTrade.receiverAvatar ||
    matchedReceiver?.avatar ||
    matchedReceiver?.photo ||
    '';

  const initialMessageText =
    acceptedTrade.message || acceptedTrade.messages?.[0]?.text || '';

  const createdAt =
    typeof acceptedTrade.createdAt === 'number'
      ? acceptedTrade.createdAt
      : Date.now();

  return {
    id: `prop-${Date.now()}`,
    tradeId: acceptedTrade.id ? String(acceptedTrade.id) : null,
    senderId,
    senderName,
    senderAvatar,
    receiverId,
    receiverName,
    receiverAvatar,
    targetOwnerId: receiverId,
    targetOwnerName: receiverName,
    requestedPuzzleId: requestedPuzzleId ? String(requestedPuzzleId) : null,
    offeredPuzzleId: offeredPuzzleId ? String(offeredPuzzleId) : null,
    puzzleTargetTitle:
      requestedPuzzle?.title ||
      acceptedTrade.requestedPuzzleTitle ||
      acceptedTrade.puzzleTitle ||
      'Tu rompecabezas',
    puzzleOfferedTitle:
      offeredPuzzle?.title ||
      acceptedTrade.offeredPuzzleTitle ||
      'Rompecabezas ofrecido',
    status: 'accepted',
    read: false,
    createdAt,
    messages: initialMessageText
      ? [{ senderId, sender: senderName, text: initialMessageText, time: 'Ahora' }]
      : [],
  };
}