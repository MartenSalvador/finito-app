const BLOCKS_STORAGE_KEY = 'finito_blocked_users_v1';
const REPORTS_STORAGE_KEY = 'finito_user_reports_v1';

function removeUserFromStorageMap(storageKey, userId) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && userId in parsed) {
      delete parsed[userId];
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    }
  } catch {
    // Ignorar errores de storage
  }
}

export function deleteAccountAndData({
  userId,
  setUsers,
  setPuzzles,
  setCompletedPuzzles,
  setUserBadges,
  setFavorites,
  setTrades,
  setProposals,
  resetTradesSessionState,
  setTradeModalPuzzle,
  setViewedUserId,
  setCurrentUser,
  setIsLoggedIn,
  setActiveTab,
  setPreviousTab,
}) {
  if (!userId) return;
  const targetId = String(userId);

  removeUserFromStorageMap(BLOCKS_STORAGE_KEY, userId);
  removeUserFromStorageMap(BLOCKS_STORAGE_KEY, targetId);
  removeUserFromStorageMap(REPORTS_STORAGE_KEY, userId);
  removeUserFromStorageMap(REPORTS_STORAGE_KEY, targetId);

  setPuzzles?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (p) => String(p?.userId ?? p?.ownerId ?? '') !== targetId
        )
      : []
  );

  setCompletedPuzzles?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (item) => String(item?.userId ?? item?.ownerId ?? '') !== targetId
        )
      : []
  );

  setUserBadges?.((prev) => {
    if (!prev || typeof prev !== 'object') return {};
    const next = { ...prev };
    delete next[userId];
    delete next[targetId];
    return next;
  });

  setFavorites?.((prev) => {
    if (!prev || typeof prev !== 'object') return {};
    const next = { ...prev };
    delete next[userId];
    delete next[targetId];
    return next;
  });

  setTrades?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (tr) =>
            String(tr?.senderId ?? tr?.sender?.id ?? '') !== targetId &&
            String(tr?.receiverId ?? tr?.receiver?.id ?? tr?.targetUserId ?? '') !==
              targetId
        )
      : []
  );

  setProposals?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (prop) =>
            String(prop?.senderId ?? '') !== targetId &&
            String(
              prop?.receiverId ?? prop?.recipientId ?? prop?.targetOwnerId ?? ''
            ) !== targetId
        )
      : []
  );

  setUsers?.((prev) =>
    Array.isArray(prev)
      ? prev.filter((u) => String(u?.id) !== targetId)
      : []
  );

  resetTradesSessionState?.();
  setTradeModalPuzzle?.(null);
  setViewedUserId?.(null);
  setCurrentUser?.(null);
  setIsLoggedIn?.(false);
  setActiveTab?.('explore');
  setPreviousTab?.('explore');
}