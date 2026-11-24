import { useState, useEffect, useCallback, useMemo } from 'react';
import { buildAcceptedTradeProposal } from '../utils/tradeHelpers';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function useTradeLifecycle({
  currentUser,
  users,
  puzzles,
  setPuzzles,
  setFavorites,
  setActiveTab,
  trades,
  setTrades,
  proposals,
  setProposals,
  blockedUserIds = [],
  t,
}) {
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const blockedSet = useMemo(
    () => new Set(Array.isArray(blockedUserIds) ? blockedUserIds : []),
    [blockedUserIds]
  );

  const isBlockedPair = useCallback(
    (otherUserId) => {
      if (!otherUserId || !currentUser?.id) return false;
      return otherUserId !== currentUser.id && blockedSet.has(otherUserId);
    },
    [blockedSet, currentUser]
  );

  // Vencimiento automático de propuestas pendientes tras 48 horas
  useEffect(() => {
    const expireOutdatedTrades = () => {
      const now = Date.now();
      setTrades((prev) => {
        let changed = false;
        const next = prev.map((tr) => {
          const isPending = !tr.status || tr.status === 'pending';
          if (!isPending) return tr;

          const expiresAt =
            typeof tr.expiresAt === 'number'
              ? tr.expiresAt
              : typeof tr.createdAt === 'number'
                ? tr.createdAt + FORTY_EIGHT_HOURS_MS
                : null;

          if (expiresAt && now >= expiresAt) {
            changed = true;
            return {
              ...tr,
              status: 'rejected',
              expired: true,
              rejectedAt: now,
            };
          }
          return tr;
        });
        return changed ? next : prev;
      });
    };

    expireOutdatedTrades();
    const interval = setInterval(() => {
      setNow(Date.now());
      expireOutdatedTrades();
    }, 30000);
    return () => clearInterval(interval);
  }, [setTrades]);

  const pendingTradesCount = currentUser?.id
    ? trades.filter((tr) => {
        const isPending = !tr.status || tr.status === 'pending';
        if (!isPending) return false;

        const expiresAt =
          typeof tr.expiresAt === 'number'
            ? tr.expiresAt
            : typeof tr.createdAt === 'number'
              ? tr.createdAt + FORTY_EIGHT_HOURS_MS
              : null;
        if (expiresAt && now >= expiresAt) return false;

        const senderId = tr.sender?.id || tr.senderId;
        if (senderId === currentUser.id) return false;
        if (isBlockedPair(senderId)) return false;

        const explicitTargetId = tr.targetUserId || tr.receiverId || tr.ownerId;
        if (explicitTargetId) {
          return explicitTargetId === currentUser.id;
        }

        const foundRequested = puzzles.find((p) => p.id === tr.requestedPuzzleId);
        const requested = foundRequested || tr.requestedPuzzle;
        const ownerId =
          requested?.userId ||
          requested?.ownerId ||
          tr.requestedPuzzle?.userId;

        return ownerId === currentUser.id;
      }).length
    : 0;

  const markProposalsRead = useCallback(() => {
    setProposals((prev) => prev.map((p) => ({ ...p, read: true })));
  }, [setProposals]);

  const clearSelectedProposal = useCallback(() => {
    setSelectedProposalId(null);
  }, []);

  const resetTradesSessionState = useCallback(() => {
    setSelectedProposalId(null);
  }, []);

  const createTradeProposal = useCallback(
    (newProp, targetPuzzle) => {
      const targetOwnerId =
        newProp.receiverId ||
        newProp.targetOwnerId ||
        targetPuzzle?.userId ||
        targetPuzzle?.ownerId;

      if (isBlockedPair(targetOwnerId)) return;

      const now = Date.now();

      const normalizedTrade = {
        id: newProp.id || `tr_${now}`,
        senderId: newProp.senderId || currentUser?.id,
        senderName: newProp.senderName || currentUser?.name,
        senderAvatar: newProp.senderAvatar || currentUser?.avatar || '',
        receiverId: targetOwnerId,
        receiverName:
          newProp.receiverName ||
          newProp.targetOwnerName ||
          targetPuzzle?.userName,
        requestedPuzzleId:
          newProp.requestedPuzzleId ||
          newProp.puzzleTargetId ||
          targetPuzzle?.id,
        requestedPuzzle: targetPuzzle || newProp.requestedPuzzle,
        offeredPuzzleId: newProp.offeredPuzzleId || newProp.puzzleOfferedId,
        offeredPuzzle: newProp.offeredPuzzle,
        message: newProp.message || newProp.messages?.[0]?.text || '',
        status: 'pending',
        createdAt: now,
        expiresAt: now + FORTY_EIGHT_HOURS_MS,
      };

      setTrades((prev) => [normalizedTrade, ...prev]);
      setActiveTab('trades');
    },
    [currentUser, isBlockedPair, setActiveTab, setTrades]
  );

  const acceptTrade = useCallback(
    (tradeId) => {
      const acceptedTrade = trades.find((tr) => tr.id === tradeId);
      if (!acceptedTrade) return;

      const otherUserId =
        (acceptedTrade.sender?.id || acceptedTrade.senderId) === currentUser?.id
          ? acceptedTrade.receiverId || acceptedTrade.targetUserId || acceptedTrade.ownerId
          : acceptedTrade.sender?.id || acceptedTrade.senderId;

      if (isBlockedPair(otherUserId)) return;

      const existingProposal = proposals.find(
        (p) => p.tradeId === tradeId || p.id === acceptedTrade.chatProposalId
      );
      if (existingProposal) {
        setProposals((prev) =>
          prev.map((p) => (p.id === existingProposal.id ? { ...p, read: true } : p))
        );
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === tradeId
              ? { ...tr, status: 'accepted', chatProposalId: existingProposal.id }
              : tr
          )
        );
        setSelectedProposalId(existingProposal.id);
        setActiveTab('messages');
        return;
      }

      const builtProposal = buildAcceptedTradeProposal(
        acceptedTrade,
        puzzles,
        users,
        currentUser
      );

      const requestedPuzzle =
        puzzles.find((p) => p.id === acceptedTrade.requestedPuzzleId) ||
        acceptedTrade.requestedPuzzle;
      const offeredPuzzle =
        puzzles.find((p) => p.id === acceptedTrade.offeredPuzzleId) ||
        acceptedTrade.offeredPuzzle;

      const senderId =
        builtProposal?.senderId ||
        acceptedTrade.sender?.id ||
        acceptedTrade.senderId ||
        null;

      const senderName =
        builtProposal?.senderName ||
        acceptedTrade.sender?.name ||
        acceptedTrade.senderName ||
        users.find((u) => u.id === senderId)?.name ||
        'Usuario';

      const receiverId =
        builtProposal?.receiverId ||
        builtProposal?.recipientId ||
        builtProposal?.targetOwnerId ||
        acceptedTrade.receiverId ||
        acceptedTrade.targetUserId ||
        acceptedTrade.ownerId ||
        requestedPuzzle?.userId ||
        currentUser?.id ||
        null;

      const receiverName =
        builtProposal?.receiverName ||
        builtProposal?.recipientName ||
        builtProposal?.targetOwnerName ||
        acceptedTrade.receiverName ||
        users.find((u) => u.id === receiverId)?.name ||
        currentUser?.name ||
        'Usuario';

      const requestedPuzzleId =
        builtProposal?.requestedPuzzleId ||
        acceptedTrade.requestedPuzzleId ||
        requestedPuzzle?.id ||
        null;

      const offeredPuzzleId =
        builtProposal?.offeredPuzzleId ||
        acceptedTrade.offeredPuzzleId ||
        offeredPuzzle?.id ||
        null;

      const puzzleTargetTitle =
        builtProposal?.puzzleTargetTitle ||
        requestedPuzzle?.title ||
        acceptedTrade.puzzleTitle ||
        'Rompecabezas';

      const puzzleOfferedTitle =
        builtProposal?.puzzleOfferedTitle ||
        offeredPuzzle?.title ||
        'Rompecabezas ofrecido';

      const newChatProposal = {
        ...(builtProposal || {}),
        id: builtProposal?.id || `chat_${tradeId}_${Date.now()}`,
        tradeId,
        senderId,
        senderName,
        receiverId,
        receiverName,
        targetOwnerId: receiverId,
        targetOwnerName: receiverName,
        requestedPuzzleId,
        offeredPuzzleId,
        puzzleTargetTitle,
        puzzleOfferedTitle,
        status: 'accepted',
        read: true,
        messages:
          Array.isArray(builtProposal?.messages) && builtProposal.messages.length > 0
            ? builtProposal.messages
            : acceptedTrade.message
              ? [
                  {
                    senderId,
                    sender: senderName,
                    text: acceptedTrade.message,
                    time: t?.justNow || 'Hace un momento',
                  },
                ]
              : [],
        confirmations: {
          ...(senderId ? { [senderId]: false } : {}),
          ...(receiverId ? { [receiverId]: false } : {}),
        },
      };

      setProposals((prev) => [newChatProposal, ...prev]);
      setTrades((prev) =>
        prev.map((tr) =>
          tr.id === tradeId
            ? { ...tr, status: 'accepted', chatProposalId: newChatProposal.id }
            : tr
        )
      );
      setSelectedProposalId(newChatProposal.id);
      setActiveTab('messages');
    },
    [
      trades,
      proposals,
      puzzles,
      users,
      currentUser,
      isBlockedPair,
      setActiveTab,
      setProposals,
      setTrades,
      t,
    ]
  );

  const rejectTrade = useCallback((tradeId) => {
    setTrades((prev) =>
      prev.map((tr) =>
        tr.id === tradeId
          ? { ...tr, status: 'rejected', rejectedAt: Date.now() }
          : tr
      )
    );
  }, [setTrades]);

  const openChatFromTrade = useCallback(
    (trade) => {
      const matchedProposal = proposals.find(
        (p) => p.id === trade.chatProposalId || p.tradeId === trade.id
      );
      if (matchedProposal) {
        setProposals((prev) =>
          prev.map((p) => (p.id === matchedProposal.id ? { ...p, read: true } : p))
        );
        setSelectedProposalId(matchedProposal.id);
      }
      setActiveTab('messages');
    },
    [proposals, setActiveTab, setProposals]
  );

  const completeTrade = useCallback(
    (proposalOrTrade) => {
      if (!proposalOrTrade) return;

      const relatedTrade = trades.find(
        (tr) =>
          tr.id === proposalOrTrade.tradeId ||
          tr.chatProposalId === proposalOrTrade.id ||
          tr.id === proposalOrTrade.id
      );

      if (relatedTrade?.status === 'completed' || proposalOrTrade._tradeRemoved) {
        return;
      }

      const requestedId =
        proposalOrTrade.requestedPuzzleId ||
        proposalOrTrade.puzzleTargetId ||
        relatedTrade?.requestedPuzzleId ||
        relatedTrade?.requestedPuzzle?.id ||
        null;

      const offeredId =
        proposalOrTrade.offeredPuzzleId ||
        proposalOrTrade.puzzleOfferedId ||
        relatedTrade?.offeredPuzzleId ||
        relatedTrade?.offeredPuzzle?.id ||
        null;

      const targetTitle =
        proposalOrTrade.puzzleTargetTitle ||
        relatedTrade?.requestedPuzzle?.title ||
        null;

      const offeredTitle =
        proposalOrTrade.puzzleOfferedTitle ||
        relatedTrade?.offeredPuzzle?.title ||
        null;

      const idsToRemove = new Set([requestedId, offeredId].filter(Boolean));

      setPuzzles((prev) =>
        prev.filter((puzzle) => {
          if (idsToRemove.has(puzzle.id)) return false;

          if (
            idsToRemove.size === 0 &&
            ((targetTitle &&
              puzzle.title?.trim().toLowerCase() === targetTitle.trim().toLowerCase() &&
              puzzle.userId === proposalOrTrade.receiverId) ||
              (offeredTitle &&
                puzzle.title?.trim().toLowerCase() === offeredTitle.trim().toLowerCase() &&
                puzzle.userId === proposalOrTrade.senderId))
          ) {
            return false;
          }

          return true;
        })
      );

      if (idsToRemove.size > 0) {
        setFavorites((prev) => {
          if (Array.isArray(prev)) {
            return prev.filter((id) => !idsToRemove.has(id));
          }
          const next = {};
          Object.entries(prev || {}).forEach(([userId, favIds]) => {
            next[userId] = Array.isArray(favIds)
              ? favIds.filter((id) => !idsToRemove.has(id))
              : [];
          });
          return next;
        });
      }

      if (relatedTrade?.id) {
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === relatedTrade.id
              ? { ...tr, status: 'completed', completedAt: Date.now() }
              : tr
          )
        );
      }

      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === proposalOrTrade.id ||
          (relatedTrade?.id && prop.tradeId === relatedTrade.id)
            ? {
                ...prop,
                status: 'completed',
                completedAt: prop.completedAt || Date.now(),
              }
            : prop
        )
      );
    },
    [trades, setPuzzles, setFavorites, setProposals, setTrades]
  );

  return {
    trades,
    setTrades,
    proposals,
    setProposals,
    selectedProposalId,
    pendingTradesCount,
    markProposalsRead,
    clearSelectedProposal,
    resetTradesSessionState,
    createTradeProposal,
    acceptTrade,
    rejectTrade,
    openChatFromTrade,
    completeTrade,
  };
}