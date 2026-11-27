export function evaluateUserBadges({
  user,
  userId,
  existingBadges = [],
  completedPuzzles = [],
  trades = [],
  proposals = [],
}) {
  const persistedBadges = Array.isArray(user?.badges) ? user.badges : [];
  const currentBadges = Array.isArray(existingBadges) ? existingBadges : [];
  const earned = new Set([...persistedBadges, ...currentBadges]);

  if (!userId) return Array.from(earned);

  const targetId = String(userId);

  // 1. Mesa armada ("gallery-keeper"): compartió al menos 1 rompecabezas terminado
  const userCompletedCount = completedPuzzles.filter(
    (item) => String(item?.userId ?? item?.ownerId ?? '') === targetId
  ).length;

  if (userCompletedCount >= 1) {
    earned.add('gallery-keeper');
  }

  // 2. Intercambios completados ("first-swap" y "active-trader")
  const completedTradesFromTrades = trades.filter((tr) => {
    if (tr.status !== 'completed') return false;
    const participantIds = [
      tr.senderId,
      tr.sender?.id,
      tr.receiverId,
      tr.targetUserId,
      tr.ownerId,
    ]
      .filter(Boolean)
      .map(String);
    return participantIds.includes(targetId);
  });

  const completedTradesFromProposals = proposals.filter((prop) => {
    if (prop.status !== 'completed') return false;
    const participantIds = [
      prop.senderId,
      prop.receiverId,
      prop.recipientId,
      prop.targetOwnerId,
    ]
      .filter(Boolean)
      .map(String);
    return participantIds.includes(targetId);
  });

  // Evitamos contar doble el mismo intercambio si existe en ambos arrays
  const uniqueCompletedTradeKeys = new Set();
  [...completedTradesFromTrades, ...completedTradesFromProposals].forEach((item) => {
    const key = item.tradeId || item.id;
    if (key) uniqueCompletedTradeKeys.add(String(key));
  });

  const completedSwapsCount = uniqueCompletedTradeKeys.size;

  if (completedSwapsCount >= 1) {
    earned.add('first-swap');
  }

  if (completedSwapsCount >= 5) {
    earned.add('active-trader');
  }

  // 3. Vecino confiable ("trusted-neighbor"): valoración >= 4.8
  const rating = Number(user?.rating);
  if (Number.isFinite(rating) && rating >= 4.8) {
    earned.add('trusted-neighbor');
  }

  return Array.from(earned);
}