import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { buildAcceptedTradeProposal } from '../utils/tradeHelpers';
import { isFirestoreDocId } from '../utils/firestoreIdHelpers';

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
      const currentTs = Date.now();
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

          if (expiresAt && currentTs >= expiresAt) {
            changed = true;
            if (isFirestoreDocId(tr.id)) {
              updateDoc(doc(db, 'trades', tr.id), {
                status: 'rejected',
                expired: true,
                rejectedAt: currentTs,
              }).catch((err) =>
                console.error('Error marcando intercambio vencido:', err)
              );
            }
            return {
              ...tr,
              status: 'rejected',
              expired: true,
              rejectedAt: currentTs,
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

  const clearSelectedProposal = useCallback(() => {
    setSelectedProposalId(null);
  }, []);

  const resetTradesSessionState = useCallback(() => {
    setSelectedProposalId(null);
  }, []);

  const createTradeProposal = useCallback(
    async (newProp, targetPuzzle) => {
      const targetOwnerId =
        newProp.receiverId ||
        newProp.targetOwnerId ||
        targetPuzzle?.userId ||
        targetPuzzle?.ownerId;

      if (isBlockedPair(targetOwnerId)) return;

      const createdTs = Date.now();
      const expiresAt = createdTs + FORTY_EIGHT_HOURS_MS;

      const tradePayload = {
        senderId: newProp.senderId || currentUser?.id,
        senderName: newProp.senderName || currentUser?.name,
        senderAvatar: newProp.senderAvatar || currentUser?.avatar || '',
        receiverId: targetOwnerId,
        receiverName:
          newProp.receiverName ||
          newProp.targetOwnerName ||
          targetPuzzle?.userName ||
          '',
        requestedPuzzleId:
          newProp.requestedPuzzleId ||
          newProp.puzzleTargetId ||
          targetPuzzle?.id ||
          null,
        requestedPuzzleTitle:
          targetPuzzle?.title || newProp.requestedPuzzle?.title || '',
        offeredPuzzleId: newProp.offeredPuzzleId || newProp.puzzleOfferedId || null,
        offeredPuzzleTitle: newProp.offeredPuzzle?.title || '',
        message: newProp.message || newProp.messages?.[0]?.text || '',
        status: 'pending',
        createdAt: createdTs,
        expiresAt,
        serverCreatedAt: serverTimestamp(),
      };

      const optimisticTrade = {
        id: newProp.id || `tr_${createdTs}`,
        ...tradePayload,
        requestedPuzzle: targetPuzzle || newProp.requestedPuzzle,
        offeredPuzzle: newProp.offeredPuzzle,
      };

      setTrades((prev) => [optimisticTrade, ...prev]);
      setActiveTab('trades');

      try {
        const docRef = await addDoc(collection(db, 'trades'), tradePayload);
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === optimisticTrade.id ? { ...tr, id: docRef.id } : tr
          )
        );
      } catch (error) {
        console.error('Error guardando propuesta de intercambio en Firestore:', error);
        setTrades((prev) =>
          prev.filter((tr) => tr.id !== optimisticTrade.id)
        );
        setActiveTab('explore');
        throw error;
      }
    },
    [currentUser, isBlockedPair, setActiveTab, setTrades]
  );

  const acceptTrade = useCallback(
    async (tradeId) => {
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
        const readBy = {
          ...existingProposal.readBy,
          [currentUser.id]: true,
        };
        setProposals((prev) =>
          prev.map((p) => (p.id === existingProposal.id ? { ...p, readBy } : p))
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

        if (isFirestoreDocId(existingProposal.id)) {
          updateDoc(doc(db, 'proposals', existingProposal.id), {
            [`readBy.${currentUser.id}`]: true,
          }).catch((err) =>
            console.error('Error actualizando lectura de propuesta:', err)
          );
        }
        if (isFirestoreDocId(tradeId)) {
          updateDoc(doc(db, 'trades', tradeId), {
            status: 'accepted',
            chatProposalId: existingProposal.id,
          }).catch((err) =>
            console.error('Error actualizando estado de intercambio:', err)
          );
        }
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

      const tempProposalId = builtProposal?.id || `chat_${tradeId}_${Date.now()}`;

      const proposalFields = { ...(builtProposal || {}) };
      delete proposalFields.id;
      const proposalPayload = {
        ...proposalFields,
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
        readBy: { [currentUser.id]: true },
        createdAt: Date.now(),
        serverCreatedAt: serverTimestamp(),
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
                    sentAt: Date.now(),
                  },
                ]
              : [],
        confirmations: {
          ...(senderId ? { [senderId]: false } : {}),
          ...(receiverId ? { [receiverId]: false } : {}),
        },
      };

      const optimisticProposal = {
        id: tempProposalId,
        ...proposalPayload,
      };

      setProposals((prev) => [optimisticProposal, ...prev]);
      setTrades((prev) =>
        prev.map((tr) =>
          tr.id === tradeId
            ? { ...tr, status: 'accepted', chatProposalId: tempProposalId }
            : tr
        )
      );
      setSelectedProposalId(tempProposalId);
      setActiveTab('messages');

      try {
        const propDocRef = await addDoc(collection(db, 'proposals'), proposalPayload);
        setProposals((prev) =>
          prev.map((p) => (p.id === tempProposalId ? { ...p, id: propDocRef.id } : p))
        );
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === tradeId ? { ...tr, chatProposalId: propDocRef.id } : tr
          )
        );
        setSelectedProposalId((prevSelected) =>
          prevSelected === tempProposalId ? propDocRef.id : prevSelected
        );

        if (isFirestoreDocId(tradeId)) {
          await updateDoc(doc(db, 'trades', tradeId), {
            status: 'accepted',
            chatProposalId: propDocRef.id,
          });
        }
      } catch (error) {
        console.error('Error aceptando intercambio en Firestore:', error);
        setProposals((prev) =>
          prev.filter((p) => p.id !== tempProposalId)
        );
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === tradeId
              ? { ...tr, status: 'pending', chatProposalId: null }
              : tr
          )
        );
        setSelectedProposalId(null);
        setActiveTab('trades');
      }
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

  const rejectTrade = useCallback(
    async (tradeId) => {
      const rejectedAt = Date.now();
      setTrades((prev) =>
        prev.map((tr) =>
          tr.id === tradeId ? { ...tr, status: 'rejected', rejectedAt } : tr
        )
      );

      if (!isFirestoreDocId(tradeId)) return;

      try {
        await updateDoc(doc(db, 'trades', tradeId), {
          status: 'rejected',
          rejectedAt,
        });
      } catch (error) {
        console.error('Error rechazando intercambio en Firestore:', error);
      }
    },
    [setTrades]
  );

  const openChatFromTrade = useCallback(
    (trade) => {
      const matchedProposal = proposals.find(
        (p) => p.id === trade.chatProposalId || p.tradeId === trade.id
      );
      if (matchedProposal) {
        const readBy = {
          ...matchedProposal.readBy,
          [currentUser?.id]: true,
        };
        setProposals((prev) =>
          prev.map((p) => (p.id === matchedProposal.id ? { ...p, readBy } : p))
        );
        setSelectedProposalId(matchedProposal.id);
        if (isFirestoreDocId(matchedProposal.id)) {
          updateDoc(doc(db, 'proposals', matchedProposal.id), {
            [`readBy.${currentUser?.id}`]: true,
          }).catch((err) => console.error('Error marcando chat como leído:', err));
        }
      }
      setActiveTab('messages');
    },
    [currentUser?.id, proposals, setActiveTab, setProposals]
  );

  const completeTrade = useCallback(
    async (proposalOrTrade) => {
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

      const matchedPuzzles = puzzles.filter((puzzle) => {
        if (requestedId && puzzle.id === requestedId) return true;
        if (offeredId && puzzle.id === offeredId) return true;
        if (
          !requestedId &&
          !offeredId &&
          ((targetTitle &&
            puzzle.title?.trim().toLowerCase() === targetTitle.trim().toLowerCase() &&
            puzzle.userId === proposalOrTrade.receiverId) ||
            (offeredTitle &&
              puzzle.title?.trim().toLowerCase() === offeredTitle.trim().toLowerCase() &&
              puzzle.userId === proposalOrTrade.senderId))
        ) {
          return true;
        }
        return false;
      });

      const idsToRemove = new Set(matchedPuzzles.map((p) => p.id));
      if (requestedId) idsToRemove.add(requestedId);
      if (offeredId) idsToRemove.add(offeredId);

      setPuzzles((prev) => prev.filter((puzzle) => !idsToRemove.has(puzzle.id)));

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

      const completedAt = proposalOrTrade.completedAt || Date.now();

      if (relatedTrade?.id) {
        setTrades((prev) =>
          prev.map((tr) =>
            tr.id === relatedTrade.id ? { ...tr, status: 'completed', completedAt } : tr
          )
        );
      }

      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === proposalOrTrade.id ||
          (relatedTrade?.id && prop.tradeId === relatedTrade.id)
            ? { ...prop, status: 'completed', completedAt }
            : prop
        )
      );

      // Persiste cambios en Firestore
      for (const puzzleId of idsToRemove) {
        if (!String(puzzleId).startsWith('p')) {
          deleteDoc(doc(db, 'puzzles', puzzleId)).catch((err) =>
            console.error('Error eliminando puzzle intercambiado en Firestore:', err)
          );
        }
      }

      if (currentUser?.id && idsToRemove.size > 0) {
        for (const puzzleId of idsToRemove) {
          updateDoc(doc(db, 'users', currentUser.id), {
            favorites: arrayRemove(puzzleId),
          }).catch(() => {});
        }
      }

      if (relatedTrade?.id && isFirestoreDocId(relatedTrade.id)) {
        updateDoc(doc(db, 'trades', relatedTrade.id), {
          status: 'completed',
          completedAt,
        }).catch((err) =>
          console.error('Error marcando trade como completado:', err)
        );
      }

    },
    [currentUser, puzzles, trades, setPuzzles, setFavorites, setProposals, setTrades]
  );

  return {
    trades,
    setTrades,
    proposals,
    setProposals,
    selectedProposalId,
    pendingTradesCount,
    clearSelectedProposal,
    resetTradesSessionState,
    createTradeProposal,
    acceptTrade,
    rejectTrade,
    openChatFromTrade,
    completeTrade,
  };
}