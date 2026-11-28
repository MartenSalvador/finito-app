import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const BLOCKS_STORAGE_KEY = 'finito_blocked_users_v1';
const REPORTS_STORAGE_KEY = 'finito_user_reports_v1';

function readStorageMap(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignorar errores de cuota o entorno restringido
  }
}

function isFirestoreDocId(id) {
  if (!id) return false;
  const str = String(id);
  return (
    !str.startsWith('tr_') &&
    !str.startsWith('chat_') &&
    !str.startsWith('rep_') &&
    !str.startsWith('t')
  );
}

export function useModeration({
  currentUser,
  setTrades,
  setProposals,
  t,
}) {
  const userKey = currentUser?.id || 'guest';

  const [blocksByUser, setBlocksByUser] = useState(() =>
    readStorageMap(BLOCKS_STORAGE_KEY)
  );
  const [reportsByUser, setReportsByUser] = useState(() =>
    readStorageMap(REPORTS_STORAGE_KEY)
  );

  useEffect(() => {
    writeStorageMap(BLOCKS_STORAGE_KEY, blocksByUser);
  }, [blocksByUser]);

  useEffect(() => {
    writeStorageMap(REPORTS_STORAGE_KEY, reportsByUser);
  }, [reportsByUser]);

  // Hidrata bloqueos desde el documento del usuario en Firestore si existen
  useEffect(() => {
    if (!currentUser?.id || !Array.isArray(currentUser.blockedUserIds)) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlocksByUser((prev) => {
      const prevList = Array.isArray(prev[currentUser.id]) ? prev[currentUser.id] : [];
      const merged = Array.from(new Set([...prevList, ...currentUser.blockedUserIds]));
      const same =
        prevList.length === merged.length &&
        prevList.every((id) => merged.includes(id));
      if (same) return prev;
      return {
        ...prev,
        [currentUser.id]: merged,
      };
    });
  }, [currentUser?.id, currentUser?.blockedUserIds]);

  const blockedUserIds = useMemo(
    () => (Array.isArray(blocksByUser[userKey]) ? blocksByUser[userKey] : []),
    [blocksByUser, userKey]
  );

  const reports = Array.isArray(reportsByUser[userKey])
    ? reportsByUser[userKey]
    : [];

  const isUserBlocked = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return blockedUserIds.includes(targetUserId);
    },
    [blockedUserIds]
  );

  const blockUser = useCallback(
    async (targetUserId, contextProposal = null) => {
      if (!targetUserId || !currentUser?.id || targetUserId === currentUser.id) {
        return;
      }

      setBlocksByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        if (currentList.includes(targetUserId)) return prev;
        return {
          ...prev,
          [userKey]: [...currentList, targetUserId],
        };
      });

      const now = Date.now();
      const targetName =
        contextProposal?.senderName ||
        contextProposal?.receiverName ||
        'este usuario';
      const sysMsg = {
        senderId: currentUser.id,
        sender: currentUser.name || 'Usuario',
        text: (
          t?.userBlockedSystemMsg ||
          'Bloqueaste a {name}. Ya no podrán enviarse mensajes ni nuevas propuestas.'
        ).replace('{name}', targetName),
        time: t?.justNow || 'Hace un momento',
        sentAt: now,
      };

      if (setTrades) {
        setTrades((prev) => {
          prev.forEach((tr) => {
            const isPending = !tr.status || tr.status === 'pending';
            if (!isPending) return;

            const involvedUser =
              tr.senderId === targetUserId ||
              tr.sender?.id === targetUserId ||
              tr.receiverId === targetUserId ||
              tr.targetUserId === targetUserId ||
              tr.receiver?.id === targetUserId;

            if (involvedUser && isFirestoreDocId(tr.id)) {
              updateDoc(doc(db, 'trades', tr.id), {
                status: 'rejected',
                blockedByUser: true,
                rejectedAt: now,
              }).catch((err) =>
                console.error('Error rechazando intercambio por bloqueo:', err)
              );
            }
          });

          return prev.map((tr) => {
            const isPending = !tr.status || tr.status === 'pending';
            if (!isPending) return tr;

            const involvedUser =
              tr.senderId === targetUserId ||
              tr.sender?.id === targetUserId ||
              tr.receiverId === targetUserId ||
              tr.targetUserId === targetUserId ||
              tr.receiver?.id === targetUserId;

            if (!involvedUser) return tr;

            return {
              ...tr,
              status: 'rejected',
              blockedByUser: true,
              rejectedAt: now,
            };
          });
        });
      }

      if (setProposals) {
        setProposals((prev) => {
          prev.forEach((prop) => {
            const involvedUser =
              prop.senderId === targetUserId ||
              prop.receiverId === targetUserId ||
              prop.recipientId === targetUserId ||
              prop.targetOwnerId === targetUserId;

            if (!involvedUser) return;

            const currentMsgs = Array.isArray(prop.messages) ? prop.messages : [];
            const alreadyHasBlockMsg = currentMsgs.some(
              (m) =>
                m.text === sysMsg.text &&
                (m.isSystem || m.senderId === currentUser.id)
            );
            const nextMsgs = alreadyHasBlockMsg
              ? currentMsgs
              : [...currentMsgs, sysMsg];

            if (isFirestoreDocId(prop.id)) {
              updateDoc(doc(db, 'proposals', prop.id), {
                blocked: true,
                blockedBy: currentUser.id,
                messages: nextMsgs,
              }).catch((err) =>
                console.error('Error actualizando chat por bloqueo:', err)
              );
            }
          });

          return prev.map((prop) => {
            const involvedUser =
              prop.senderId === targetUserId ||
              prop.receiverId === targetUserId ||
              prop.recipientId === targetUserId ||
              prop.targetOwnerId === targetUserId;

            if (!involvedUser) return prop;

            const currentMsgs = Array.isArray(prop.messages) ? prop.messages : [];
            const alreadyHasBlockMsg = currentMsgs.some(
              (m) =>
                m.text === sysMsg.text &&
                (m.isSystem || m.senderId === currentUser.id)
            );

            return {
              ...prop,
              blocked: true,
              blockedBy: currentUser.id,
              messages: alreadyHasBlockMsg
                ? currentMsgs
                : [...currentMsgs, sysMsg],
            };
          });
        });
      }

      if (isFirestoreDocId(currentUser.id)) {
        try {
          await updateDoc(doc(db, 'users', currentUser.id), {
            blockedUserIds: arrayUnion(targetUserId),
          });
        } catch (err) {
          console.error('Error guardando bloqueo en Firestore:', err);
        }
      }
    },
    [currentUser, setProposals, setTrades, t, userKey]
  );

  const unblockUser = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return;

      setBlocksByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        return {
          ...prev,
          [userKey]: currentList.filter((id) => id !== targetUserId),
        };
      });

      if (currentUser?.id && isFirestoreDocId(currentUser.id)) {
        try {
          await updateDoc(doc(db, 'users', currentUser.id), {
            blockedUserIds: arrayRemove(targetUserId),
          });
        } catch (err) {
          console.error('Error quitando bloqueo en Firestore:', err);
        }
      }
    },
    [currentUser, userKey]
  );

  const reportUser = useCallback(
    async (reportPayload) => {
      if (!reportPayload?.targetUserId && !reportPayload?.targetUserName) {
        return null;
      }

      const createdAt = reportPayload.createdAt || Date.now();
      const baseReport = {
        reporterId: currentUser?.id || null,
        reporterName: currentUser?.name || 'Usuario',
        targetUserId: reportPayload.targetUserId || null,
        targetUserName: reportPayload.targetUserName || 'Usuario',
        proposalId: reportPayload.proposalId || null,
        tradeId: reportPayload.tradeId || null,
        reason: reportPayload.reason || 'other',
        reasonLabel: reportPayload.reasonLabel || 'Otro motivo',
        note: (reportPayload.note || '').trim(),
        createdAt,
        status: 'submitted',
      };

      const tempId = `rep_${createdAt}_${Math.random().toString(36).slice(2, 7)}`;
      const optimisticReport = { id: tempId, ...baseReport };

      setReportsByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        return {
          ...prev,
          [userKey]: [optimisticReport, ...currentList],
        };
      });

      try {
        const docRef = await addDoc(collection(db, 'reports'), {
          ...baseReport,
          serverCreatedAt: serverTimestamp(),
        });

        const savedReport = { id: docRef.id, ...baseReport };
        setReportsByUser((prev) => {
          const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
          return {
            ...prev,
            [userKey]: currentList.map((item) =>
              item.id === tempId ? savedReport : item
            ),
          };
        });

        return savedReport;
      } catch (err) {
        console.error('Error enviando reporte a Firestore:', err);
        return optimisticReport;
      }
    },
    [currentUser?.id, currentUser?.name, userKey]
  );

  return {
    blockedUserIds,
    reports,
    isUserBlocked,
    blockUser,
    unblockUser,
    reportUser,
  };
}