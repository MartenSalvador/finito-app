import { useState, useEffect, useCallback, useMemo } from 'react';

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
    (targetUserId, contextProposal = null) => {
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
      const sysMsg = {
        senderId: 'system',
        sender: 'Finito',
        isSystem: true,
        text: (
          t?.userBlockedSystemMsg ||
          'Bloqueaste a {name}. Ya no podrán enviarse mensajes ni nuevas propuestas.'
        ).replace('{name}', contextProposal?.senderName || contextProposal?.receiverName || 'este usuario'),
        time: t?.justNow || 'Hace un momento',
      };

      if (setTrades) {
        setTrades((prev) =>
          prev.map((tr) => {
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
          })
        );
      }

      if (setProposals) {
        setProposals((prev) =>
          prev.map((prop) => {
            const involvedUser =
              prop.senderId === targetUserId ||
              prop.receiverId === targetUserId ||
              prop.recipientId === targetUserId ||
              prop.targetOwnerId === targetUserId;

            if (!involvedUser) return prop;

            const alreadyHasBlockMsg = (prop.messages || []).some(
              (m) => m.isSystem && m.text === sysMsg.text
            );

            return {
              ...prop,
              blocked: true,
              blockedBy: currentUser.id,
              messages: alreadyHasBlockMsg
                ? prop.messages || []
                : [...(prop.messages || []), sysMsg],
            };
          })
        );
      }
    },
    [currentUser, setProposals, setTrades, t, userKey]
  );

  const unblockUser = useCallback(
    (targetUserId) => {
      if (!targetUserId) return;
      setBlocksByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        return {
          ...prev,
          [userKey]: currentList.filter((id) => id !== targetUserId),
        };
      });
    },
    [userKey]
  );

  const reportUser = useCallback(
    (reportPayload) => {
      if (!reportPayload?.targetUserId && !reportPayload?.targetUserName) {
        return null;
      }

      const newReport = {
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        reporterId: currentUser?.id || null,
        reporterName: currentUser?.name || 'Usuario',
        targetUserId: reportPayload.targetUserId || null,
        targetUserName: reportPayload.targetUserName || 'Usuario',
        proposalId: reportPayload.proposalId || null,
        tradeId: reportPayload.tradeId || null,
        reason: reportPayload.reason || 'other',
        reasonLabel: reportPayload.reasonLabel || 'Otro motivo',
        note: (reportPayload.note || '').trim(),
        createdAt: reportPayload.createdAt || Date.now(),
        status: 'submitted',
      };

      setReportsByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        return {
          ...prev,
          [userKey]: [newReport, ...currentList],
        };
      });

      return newReport;
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