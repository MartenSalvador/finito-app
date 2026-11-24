export function buildAcceptedTradeProposal(acceptedTrade, puzzles, users, currentUser = null) {
  if (!acceptedTrade) return null;

  const requestedPuzzle =
    puzzles.find((p) => p.id === acceptedTrade.requestedPuzzleId) ||
    acceptedTrade.requestedPuzzle;
  const offeredPuzzle =
    puzzles.find((p) => p.id === acceptedTrade.offeredPuzzleId) ||
    acceptedTrade.offeredPuzzle;

  const rawSenderId =
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.id : null) ||
    acceptedTrade.senderId ||
    acceptedTrade.fromId ||
    offeredPuzzle?.userId ||
    null;

  const rawSenderName =
    (typeof acceptedTrade.sender === 'string' ? acceptedTrade.sender : null) ||
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.name : null) ||
    acceptedTrade.senderName ||
    acceptedTrade.fromName ||
    acceptedTrade.userName ||
    offeredPuzzle?.userName ||
    null;

  const matchedSender = users.find(
    (u) =>
      (rawSenderId && u.id === rawSenderId) ||
      (!rawSenderId &&
        rawSenderName &&
        u.name?.trim().toLowerCase() === rawSenderName.trim().toLowerCase())
  );

  const senderId = rawSenderId || matchedSender?.id || null;
  const senderName = rawSenderName || matchedSender?.name || 'Usuario';
  const senderAvatar =
    (typeof acceptedTrade.sender === 'object' ? acceptedTrade.sender?.avatar : null) ||
    acceptedTrade.senderAvatar ||
    matchedSender?.avatar ||
    matchedSender?.photo ||
    '';

  const rawReceiverId =
    acceptedTrade.receiverId ||
    acceptedTrade.recipientId ||
    acceptedTrade.targetUserId ||
    acceptedTrade.ownerId ||
    requestedPuzzle?.userId ||
    requestedPuzzle?.ownerId ||
    currentUser?.id ||
    null;

  const matchedReceiver = users.find((u) => rawReceiverId && u.id === rawReceiverId);

  const receiverId = rawReceiverId || matchedReceiver?.id || null;
  const receiverName =
    acceptedTrade.receiverName ||
    acceptedTrade.recipientName ||
    acceptedTrade.targetOwnerName ||
    matchedReceiver?.name ||
    (receiverId === currentUser?.id ? currentUser?.name : null) ||
    'Usuario';

  const receiverAvatar =
    acceptedTrade.receiverAvatar ||
    matchedReceiver?.avatar ||
    matchedReceiver?.photo ||
    '';

  const initialMessageText =
    acceptedTrade.message || acceptedTrade.messages?.[0]?.text || '';

  return {
    id: `prop-${Date.now()}`,
    senderId,
    senderName,
    senderAvatar,
    receiverId,
    receiverName,
    receiverAvatar,
    targetOwnerId: receiverId,
    targetOwnerName: receiverName,
    puzzleTargetTitle: requestedPuzzle?.title || 'Tu rompecabezas',
    puzzleOfferedTitle: offeredPuzzle?.title || 'Rompecabezas ofrecido',
    status: 'accepted',
    read: false,
    messages: initialMessageText
      ? [{ senderId, sender: senderName, text: initialMessageText, time: 'Ahora' }]
      : [],
  };
}