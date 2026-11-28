import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  ChevronRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flag,
  Ban,
  X,
  Archive,
  Trash2,
} from 'lucide-react';
import { db } from '../firebase/config';
import { INITIAL_USERS } from '../data/mockUsers';
import { isFirestoreDocId } from '../utils/firestoreIdHelpers';

const FALLBACK_AVATAR_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#F5F3FF"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="11">Finito</text></svg>`
  );

const REPORT_REASONS = [
  { id: 'no_show_or_scam', defaultLabel: 'Incumplimiento o conducta sospechosa' },
  { id: 'harassment_or_spam', defaultLabel: 'Acoso, spam o falta de respeto' },
  { id: 'puzzle_mismatch', defaultLabel: 'Información engañosa sobre el puzzle' },
  { id: 'other', defaultLabel: 'Otro motivo' },
];

function getCurrentTimestamp() {
  return Date.now();
}

function formatMessageTime(sentAt, lang) {
  const date =
    sentAt instanceof Date
      ? sentAt
      : typeof sentAt === 'number' || typeof sentAt === 'string'
        ? new Date(sentAt)
        : typeof sentAt?.toDate === 'function'
          ? sentAt.toDate()
          : null;

  if (!date || Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(lang || 'es', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function CounterpartAvatar({ name, avatar }) {
  const [broken, setBroken] = useState(false);

  if (avatar && !broken) {
    return (
      <img
        src={avatar}
        alt={name || 'Finito'}
        onError={() => setBroken(true)}
        className="w-9 h-9 rounded-full object-cover border border-[#E5E0F5] shrink-0 bg-[#F5F3FF]"
      />
    );
  }

  return (
    <div
      title={name || 'Finito'}
      className="w-9 h-9 rounded-full bg-[#F5F3FF] border border-[#E5E0F5] flex items-center justify-center text-xs font-extrabold text-[#5B3DF5] shrink-0"
    >
      {(name || 'F').charAt(0).toUpperCase()}
    </div>
  );
}

export default function MessagesView({
  proposals = [],
  setProposals,
  currentUser,
  users = INITIAL_USERS,
  blockedUserIds = [],
  selectedProposalId = null,
  onClearSelectedProposal,
  onConfirmTrade,
  onOpenUserProfile,
  onBlockUser,
  onUnblockUser,
  onReportUser,
  lang = 'es',
  t,
}) {
  const [activeChatId, setActiveChatId] = useState(selectedProposalId || null);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isConfirmingTrade, setIsConfirmingTrade] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [localBlockedIds, setLocalBlockedIds] = useState([]);
  const [moderationForm, setModerationForm] = useState(null);
  const chatMessageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastHandledSelectedIdRef = useRef(selectedProposalId || null);
  const currentModerationForm =
    moderationForm?.chatId === activeChatId ? moderationForm : null;
  const moderationMode = currentModerationForm?.mode || null;
  const reportReason = currentModerationForm?.reason || REPORT_REASONS[0].id;
  const reportNote = currentModerationForm?.note || '';

  const updateModerationForm = (updates) => {
    setModerationForm((prev) => {
      const current =
        prev?.chatId === activeChatId
          ? prev
          : {
              chatId: activeChatId,
              mode: null,
              reason: REPORT_REASONS[0].id,
              note: '',
            };
      return { ...current, ...updates, chatId: activeChatId };
    });
  };

  const setModerationMode = (nextMode) => {
    const currentMode = currentModerationForm?.mode || null;
    updateModerationForm({
      mode: typeof nextMode === 'function' ? nextMode(currentMode) : nextMode,
    });
  };

  const setReportReason = (reason) => updateModerationForm({ reason });
  const setReportNote = (note) => updateModerationForm({ note });

  useEffect(() => {
    if (
      selectedProposalId &&
      selectedProposalId !== lastHandledSelectedIdRef.current
    ) {
      lastHandledSelectedIdRef.current = selectedProposalId;
      setModerationForm(null);
      setActiveChatId(selectedProposalId);
    }
  }, [selectedProposalId]);

  useEffect(() => {
    return () => {
      onClearSelectedProposal?.();
    };
  }, [onClearSelectedProposal]);

  const handleBackToList = () => {
    setActiveChatId(null);
    setModerationForm(null);
    lastHandledSelectedIdRef.current = null;
    onClearSelectedProposal?.();
  };

  const handleSelectChat = (proposalId) => {
    lastHandledSelectedIdRef.current = proposalId;
    setModerationForm(null);
    setActiveChatId(proposalId);
  };

  const isSentByMe = (prop) =>
    Boolean(currentUser?.id && prop.senderId === currentUser.id) ||
    Boolean(currentUser?.name && prop.senderName === currentUser.name);

  const isParticipant = (prop) => {
    if (!currentUser?.id && !currentUser?.name) return false;

    const sentByMe = isSentByMe(prop);
    const receiverId =
      prop.receiverId || prop.recipientId || prop.targetOwnerId;
    const receivedByMe =
      Boolean(currentUser?.id && receiverId === currentUser.id) ||
      Boolean(
        currentUser?.name &&
          (prop.receiverName || prop.recipientName || prop.targetOwnerName)?.toLowerCase() ===
            currentUser.name.toLowerCase()
      );

    return sentByMe || receivedByMe;
  };

  const participantProposals = Array.isArray(proposals)
    ? proposals.filter(isParticipant)
    : [];

  const visibleProposals = participantProposals.filter(
    (proposal) => !proposal.hiddenBy?.[currentUser?.id]
  );
  const activeChat =
    participantProposals.find((p) => p.id === activeChatId) || null;
  const isPersistedChat = isFirestoreDocId(activeChat?.id);

  useEffect(() => {
    if (
      !activeChat ||
      !currentUser?.id ||
      activeChat.readBy?.[currentUser.id] === true ||
      !isFirestoreDocId(activeChat.id)
    ) {
      return;
    }

    setProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === activeChat.id
          ? {
              ...proposal,
              readBy: { ...proposal.readBy, [currentUser.id]: true },
            }
          : proposal
      )
    );
    updateDoc(doc(db, 'proposals', activeChat.id), {
      [`readBy.${currentUser.id}`]: true,
    }).catch((error) =>
      console.error('Error marcando chat como leído:', error)
    );
  }, [activeChat, currentUser?.id, setProposals]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages?.length, activeChatId]);

  const getCounterpartInfo = (prop) => {
    const sentByMe = isSentByMe(prop);

    const counterpartId = sentByMe
      ? prop.receiverId || prop.recipientId || prop.targetOwnerId || null
      : prop.senderId || null;

    const matchedUser = Array.isArray(users)
      ? users.find(
          (u) =>
            (counterpartId && u.id === counterpartId) ||
            (!counterpartId &&
              sentByMe &&
              prop.receiverName &&
              u.name?.toLowerCase() === prop.receiverName.toLowerCase()) ||
            (!counterpartId &&
              !sentByMe &&
              prop.senderName &&
              u.name?.toLowerCase() === prop.senderName.toLowerCase())
        )
      : null;

    const name = sentByMe
      ? prop.receiverName ||
        prop.recipientName ||
        prop.targetOwnerName ||
        matchedUser?.name ||
        'Usuario'
      : prop.senderName || matchedUser?.name || 'Usuario';

    const avatar = sentByMe
      ? prop.receiverAvatar ||
        matchedUser?.avatar ||
        matchedUser?.photo ||
        ''
      : prop.senderAvatar ||
        matchedUser?.avatar ||
        matchedUser?.photo ||
        '';

    return {
      id: counterpartId || matchedUser?.id || null,
      name,
      avatar,
    };
  };

  const isProposalBlocked = (prop) => {
    if (!prop) return false;
    const cp = getCounterpartInfo(prop);
    return Boolean(
      prop.blocked ||
        (cp?.id &&
          (blockedUserIds.includes(cp.id) || localBlockedIds.includes(cp.id)))
    );
  };

  const isProposalClosedOrBlocked = (prop) => {
    if (!prop) return false;
    const propMyConfirmed = Boolean(currentUser?.id && prop.confirmations?.[currentUser.id]);
    const cp = getCounterpartInfo(prop);
    const propCpConfirmed = Boolean(cp?.id && prop.confirmations?.[cp.id]);
    const isCompleted =
      prop.status === 'completed' ||
      prop.status === 'confirmed' ||
      (propMyConfirmed && propCpConfirmed);

    return isProposalBlocked(prop) || isCompleted;
  };

  const activeProposals = visibleProposals.filter(
    (prop) => !isProposalClosedOrBlocked(prop)
  );
  const closedProposals = visibleProposals.filter((prop) =>
    isProposalClosedOrBlocked(prop)
  );

  const activeCounterpart = activeChat ? getCounterpartInfo(activeChat) : null;
  const isCounterpartBlocked = Boolean(activeChat && isProposalBlocked(activeChat));

  const handleHideChat = async () => {
    if (
      !activeChat ||
      !currentUser?.id ||
      !isPersistedChat ||
      isDeletingChat
    ) {
      return;
    }

    const confirmed = window.confirm(
      t?.confirmHideChat ||
        '¿Eliminar este chat de tu buzón? La otra persona conservará la conversación.'
    );
    if (!confirmed) return;

    setIsDeletingChat(true);
    setMessageError('');
    try {
      await updateDoc(doc(db, 'proposals', activeChat.id), {
        [`hiddenBy.${currentUser.id}`]: true,
      });
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === activeChat.id
            ? {
                ...proposal,
                hiddenBy: { ...proposal.hiddenBy, [currentUser.id]: true },
              }
            : proposal
        )
      );
      setActiveChatId(null);
      setModerationForm(null);
      lastHandledSelectedIdRef.current = null;
      onClearSelectedProposal?.();
    } catch (error) {
      console.error('Error ocultando chat de la bandeja:', error);
      setMessageError(
        t?.hideChatError || 'No se pudo eliminar el chat de tu buzón. Intentá nuevamente.'
      );
    } finally {
      setIsDeletingChat(false);
    }
  };

  useEffect(() => {
    if (activeChatId && isPersistedChat && !isCounterpartBlocked) {
      chatMessageInputRef.current?.focus();
    }
  }, [activeChatId, isCounterpartBlocked, isPersistedChat]);

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (
      !chatMessageInput.trim() ||
      !activeChat ||
      !currentUser ||
      isCounterpartBlocked ||
      !isPersistedChat ||
      isSendingMessage
    ) {
      return;
    }

    const messageText = chatMessageInput.trim();
    const newMsg = {
      senderId: currentUser.id,
      sender: currentUser.name,
      text: messageText,
      time: t?.justNow || 'Hace un momento',
      sentAt: getCurrentTimestamp(),
    };

    const nextMessages = [...(activeChat.messages || []), newMsg];
    const counterpartId = activeCounterpart?.id;
    const readBy = {
      ...activeChat.readBy,
      [currentUser.id]: true,
      ...(counterpartId ? { [counterpartId]: false } : {}),
    };
    setMessageError('');
    setIsSendingMessage(true);
    setChatMessageInput('');
    chatMessageInputRef.current?.focus();
    try {
      await updateDoc(doc(db, 'proposals', activeChat.id), {
        messages: nextMessages,
        readBy,
      });
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === activeChat.id ? { ...proposal, messages: nextMessages, readBy } : proposal
        )
      );
    } catch (error) {
      console.error('Error guardando mensaje en Firestore:', error);
      setChatMessageInput((currentInput) => currentInput || messageText);
      setMessageError(
        t?.messageSendError || 'No se pudo enviar el mensaje. Intentá nuevamente.'
      );
      chatMessageInputRef.current?.focus();
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleConfirmTrade = async () => {
    if (
      !activeChat ||
      !currentUser?.id ||
      isCounterpartBlocked ||
      isConfirmingTrade
    ) {
      return;
    }

    setIsConfirmingTrade(true);
    setMessageError('');

    const counterpart = getCounterpartInfo(activeChat);
    const counterpartId = counterpart.id;
    const prevConfirmations = activeChat.confirmations || {};
    const alreadyConfirmedByMe = Boolean(prevConfirmations[currentUser.id]);
    if (alreadyConfirmedByMe) return;

    const wasAlreadyCompleted =
      activeChat.status === 'completed' || activeChat.status === 'confirmed';

    const nextConfirmations = {
      ...prevConfirmations,
      [currentUser.id]: true,
    };

    const bothConfirmed =
      Boolean(nextConfirmations[currentUser.id]) &&
      (!counterpartId || Boolean(nextConfirmations[counterpartId]));

    const systemText = bothConfirmed
      ? t?.tradeCompletedSystemMsg ||
        '¡Ambas partes confirmaron el intercambio! El cambio quedó confirmado.'
      : (
          t?.userConfirmedSystemMsg ||
          '{name} confirmó el intercambio. Falta la confirmación de la otra parte.'
        ).replace('{name}', currentUser.name || 'Usuario');

    const confirmationMsg = {
      senderId: currentUser.id,
      sender: currentUser.name || 'Usuario',
      text: systemText,
      time: t?.justNow || 'Hace un momento',
      sentAt: getCurrentTimestamp(),
    };

    const nextProposal = {
      ...activeChat,
      confirmations: nextConfirmations,
      status: bothConfirmed ? 'completed' : activeChat.status || 'accepted',
      completedAt: bothConfirmed ? getCurrentTimestamp() : activeChat.completedAt,
      messages: [...(activeChat.messages || []), confirmationMsg],
    };

    try {
      if (isFirestoreDocId(activeChat.id)) {
        await updateDoc(doc(db, 'proposals', activeChat.id), {
          confirmations: nextConfirmations,
          messages: nextProposal.messages,
          ...(bothConfirmed
            ? {
                status: 'completed',
                completedAt: nextProposal.completedAt,
              }
            : {}),
        });
      }

      if (setProposals) {
        setProposals((prev) =>
          prev.map((prop) => (prop.id === activeChat.id ? nextProposal : prop))
        );
      }

      if (bothConfirmed && !wasAlreadyCompleted && onConfirmTrade) {
        onConfirmTrade(nextProposal);
      }
    } catch (error) {
      console.error('Error guardando confirmación de intercambio:', error);
      setMessageError(
        t?.tradeConfirmError ||
          'No se pudo guardar la confirmación del intercambio. Intentá nuevamente.'
      );
    } finally {
      setIsConfirmingTrade(false);
    }
  };

const handleConfirmBlockUser = () => {
    if (!activeChat || !activeCounterpart) return;

    if (activeCounterpart.id) {
      setLocalBlockedIds((prev) =>
        prev.includes(activeCounterpart.id) ? prev : [...prev, activeCounterpart.id]
      );
    }

    if (onBlockUser) {
      onBlockUser(activeCounterpart.id, activeChat);
    }

    const blockMsg = {
      senderId: currentUser.id,
      sender: currentUser.name || 'Usuario',
      text: (
        t?.userBlockedSystemMsg ||
        'Bloqueaste a {name}. Ya no podrán enviarse mensajes ni nuevas propuestas.'
      ).replace('{name}', activeCounterpart.name || 'este usuario'),
      time: t?.justNow || 'Hace un momento',
      sentAt: getCurrentTimestamp(),
    };

    const nextMessages = [...(activeChat.messages || []), blockMsg];

    if (setProposals) {
      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === activeChat.id
            ? {
                ...prop,
                blocked: true,
                blockedBy: currentUser?.id || true,
                messages: nextMessages,
              }
            : prop
        )
      );
    }

    if (isFirestoreDocId(activeChat.id)) {
      updateDoc(doc(db, 'proposals', activeChat.id), {
        blocked: true,
        blockedBy: currentUser?.id || true,
        messages: nextMessages,
      }).catch((err) =>
        console.error('Error guardando bloqueo en propuesta:', err)
      );
    }

    setModerationMode(null);
  };

  const handleUnblockUser = () => {
    if (!activeChat || !activeCounterpart) return;

    if (activeCounterpart.id) {
      setLocalBlockedIds((prev) => prev.filter((id) => id !== activeCounterpart.id));
    }

    if (onUnblockUser) {
      onUnblockUser(activeCounterpart.id);
    }

    const unblockMsg = {
      senderId: currentUser.id,
      sender: currentUser.name || 'Usuario',
      text: (
        t?.userUnblockedSystemMsg ||
        'Desbloqueaste a {name}. Ya podés volver a enviar mensajes.'
      ).replace('{name}', activeCounterpart.name || 'este usuario'),
      time: t?.justNow || 'Hace un momento',
      sentAt: getCurrentTimestamp(),
    };

    const nextMessages = [...(activeChat.messages || []), unblockMsg];

    if (setProposals) {
      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === activeChat.id
            ? {
                ...prop,
                blocked: false,
                blockedBy: null,
                messages: nextMessages,
              }
            : prop
        )
      );
    }

    if (isFirestoreDocId(activeChat.id)) {
      updateDoc(doc(db, 'proposals', activeChat.id), {
        blocked: false,
        blockedBy: null,
        messages: nextMessages,
      }).catch((err) =>
        console.error('Error guardando desbloqueo en propuesta:', err)
      );
    }

    setModerationMode(null);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!activeChat || !activeCounterpart) return;

    const reasonObj =
      REPORT_REASONS.find((r) => r.id === reportReason) || REPORT_REASONS[0];

    if (onReportUser) {
      onReportUser({
        targetUserId: activeCounterpart.id,
        targetUserName: activeCounterpart.name,
        proposalId: activeChat.id,
        tradeId: activeChat.tradeId || null,
        reason: reportReason,
        reasonLabel: reasonObj.defaultLabel,
        note: reportNote.trim(),
        createdAt: getCurrentTimestamp(),
      });
    }

    const reportMsg = {
      senderId: currentUser.id,
      sender: currentUser.name || 'Usuario',
      text:
        t?.reportSentSystemMsg ||
        'Enviaste un reporte sobre este intercambio. Si necesitás distancia, también podés bloquear al usuario.',
      time: t?.justNow || 'Hace un momento',
      sentAt: getCurrentTimestamp(),
    };

    const nextMessages = [...(activeChat.messages || []), reportMsg];

    if (setProposals) {
      setProposals((prev) =>
        prev.map((prop) =>
          prop.id === activeChat.id
            ? {
                ...prop,
                reported: true,
                messages: nextMessages,
              }
            : prop
        )
      );
    }

    if (isFirestoreDocId(activeChat.id)) {
      updateDoc(doc(db, 'proposals', activeChat.id), {
        reported: true,
        messages: nextMessages,
      }).catch((err) =>
        console.error('Error guardando reporte en propuesta:', err)
      );
    }

    setReportNote('');
    setModerationMode(null);
  };

  const myConfirmed = Boolean(
    activeChat && currentUser?.id && activeChat.confirmations?.[currentUser.id]
  );
  const counterpartConfirmed = Boolean(
    activeChat &&
      activeCounterpart?.id &&
      activeChat.confirmations?.[activeCounterpart.id]
  );
  const isTradeCompleted =
    activeChat?.status === 'completed' ||
    activeChat?.status === 'confirmed' ||
    (myConfirmed && counterpartConfirmed);

  const getHeaderStatusBadge = (prop) => {
    const propMyConfirmed = Boolean(currentUser?.id && prop.confirmations?.[currentUser.id]);
    const cp = getCounterpartInfo(prop);
    const propCpConfirmed = Boolean(cp?.id && prop.confirmations?.[cp.id]);

    if (isProposalBlocked(prop)) {
      return {
        label: t?.statusBlocked || 'Bloqueado',
        className: 'bg-[#18181B] text-white',
      };
    }

    if (
      prop.status === 'completed' ||
      prop.status === 'confirmed' ||
      (propMyConfirmed && propCpConfirmed)
    ) {
      return {
        label: t?.completedTrade || 'Confirmado',
        className: 'bg-[#18181B] text-white',
      };
    }
    if (prop.status === 'pending') {
      return {
        label: t?.pendingProposal || 'Pendiente',
        className: 'bg-[#FFD43B] text-[#18181B]',
      };
    }
    return {
      label: t?.statusAccepted || 'Aceptado',
      className: 'bg-[#FFD43B] text-[#18181B]',
    };
  };

  const headerBadge = activeChat ? getHeaderStatusBadge(activeChat) : null;

  const renderProposalCard = (prop, isClosedItem = false) => {
    const counterpart = getCounterpartInfo(prop);
    const lastMsg = prop.messages?.[prop.messages.length - 1];
    const badge = getHeaderStatusBadge(prop);
    const isUnread = currentUser?.id
      ? prop.readBy
        ? prop.readBy[currentUser.id] !== true
        : !prop.read
      : false;

    return (
      <div
        key={prop.id}
        onClick={() => handleSelectChat(prop.id)}
        className={`group border rounded-3xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-md ${
          isClosedItem
            ? 'bg-[#F5F3FF]/60 border-[#E5E0F5] hover:border-[#5B3DF5]/35 opacity-90'
            : 'bg-white border-[#E5E0F5] hover:border-[#5B3DF5]/45'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-3">
          <CounterpartAvatar
            name={counterpart.name}
            avatar={counterpart.avatar || FALLBACK_AVATAR_IMG}
          />
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
                {counterpart.name}
              </span>
              <span className="text-[10px] bg-[#FFD43B] text-[#18181B] px-2 py-0.5 rounded-full font-extrabold shrink-0">
                {t?.tradeBadge || 'Trueque'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${badge.className}`}
              >
                {badge.label}
              </span>
              {isUnread && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-extrabold shrink-0">
                  {t?.unreadMessageBadge || 'Sin leer'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] truncate">
              {t?.wantsToTrade || 'Intercambio por'}{' '}
              <span className="text-[#18181B] font-semibold">{prop.puzzleTargetTitle}</span>
            </p>
            <p className="text-xs text-[#6B7280]/85 truncate max-w-xs">
              {lastMsg?.text || ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="bg-[#F5F3FF] text-[#5B3DF5] group-hover:bg-[#5B3DF5] group-hover:text-white border border-[#E5E0F5] text-xs font-bold px-4 py-2 rounded-2xl transition-all duration-200 active:scale-95 shrink-0"
        >
          {isClosedItem ? t?.viewChatBtn || 'Ver chat' : t?.chatBtn || 'Chat'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-extrabold flex items-center gap-2 text-[#18181B]">
        <MessageSquare className="w-6 h-6 text-[#5B3DF5]" />
        {t?.messagesTitle || 'Mensajes'}
      </h2>

      {activeChat ? (
        <div className="bg-white border border-[#E5E0F5] rounded-3xl flex flex-col h-[calc(100dvh-17rem)] min-h-[16rem] sm:h-[calc(100dvh-14rem)] sm:min-h-[20rem] shadow-sm overflow-hidden animate-modal-pop">
          {/* Cabecera del chat */}
          <div className="p-4 border-b border-[#E5E0F5] flex items-center justify-between gap-2 bg-[#F5F3FF]">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                aria-label={t?.backBtn || 'Atrás'}
                onClick={handleBackToList}
                className="text-[#6B7280] hover:text-[#18181B] bg-white hover:bg-[#EBE7FF] border border-[#E5E0F5] p-2 rounded-full transition-all duration-200 active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!activeCounterpart?.id || !onOpenUserProfile}
                onClick={() =>
                  activeCounterpart?.id &&
                  onOpenUserProfile &&
                  onOpenUserProfile(activeCounterpart.id)
                }
                className="flex items-center gap-2.5 min-w-0 text-left group disabled:cursor-default"
              >
                <CounterpartAvatar
                  name={activeCounterpart?.name}
                  avatar={activeCounterpart?.avatar || FALLBACK_AVATAR_IMG}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-sm text-[#18181B] truncate group-hover:text-[#5B3DF5] group-hover:underline transition-colors">
                      {activeCounterpart?.name}
                    </h3>
                    {activeCounterpart?.id && onOpenUserProfile && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#5B3DF5] transition-colors shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] truncate">
                    {t?.targetLabel || 'Objetivo:'} {activeChat.puzzleTargetTitle}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleHideChat}
                disabled={!isPersistedChat || isDeletingChat}
                aria-label={t?.deleteChatBtn || 'Eliminar chat'}
                title={t?.deleteChatBtn || 'Eliminar chat'}
                className="p-2 rounded-full border text-xs transition-all duration-200 active:scale-95 bg-white text-red-600 hover:bg-red-50 border-[#E5E0F5] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setModerationMode((prev) => (prev === 'report' ? null : 'report'))
                }
                aria-label={t?.reportUserBtn || 'Reportar'}
                title={t?.reportUserBtn || 'Reportar'}
                className={`p-2 rounded-full border text-xs transition-all duration-200 active:scale-95 ${
                  moderationMode === 'report'
                    ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                    : 'bg-white text-[#6B7280] hover:text-[#18181B] hover:bg-[#EBE7FF] border-[#E5E0F5]'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>

              {isCounterpartBlocked ? (
                <button
                  type="button"
                  onClick={handleUnblockUser}
                  className="inline-flex items-center gap-1 bg-white hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 shrink-0"
                >
                  {t?.unblockUserBtn || 'Desbloquear'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setModerationMode((prev) => (prev === 'block' ? null : 'block'))
                  }
                  aria-label={t?.blockUserBtn || 'Bloquear'}
                  title={t?.blockUserBtn || 'Bloquear'}
                  className={`p-2 rounded-full border text-xs transition-all duration-200 active:scale-95 ${
                    moderationMode === 'block'
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-white text-[#6B7280] hover:text-[#18181B] hover:bg-[#EBE7FF] border-[#E5E0F5]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              )}

              <span
                className={`text-xs px-3 py-1 rounded-full font-extrabold shrink-0 ${headerBadge?.className}`}
              >
                {headerBadge?.label}
              </span>
            </div>
          </div>

          {/* Panel inline de Reportar o Bloquear */}
          {moderationMode === 'report' && (
            <form
              onSubmit={handleSubmitReport}
              className="px-4 py-3 bg-[#F5F3FF] border-b border-[#E5E0F5] space-y-2.5 animate-slide-step"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#18181B]">
                  {(t?.reportTitle || 'Reportar a {name}').replace(
                    '{name}',
                    activeCounterpart?.name || 'usuario'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setModerationMode(null)}
                  className="text-[#6B7280] hover:text-[#18181B] p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-white border border-[#E5E0F5] rounded-xl px-3 py-2 text-xs text-[#18181B] font-medium focus:outline-none focus:border-[#5B3DF5]"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.defaultLabel}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder={
                  t?.reportNotePlaceholder || 'Detalle opcional (sin datos sensibles)...'
                }
                className="w-full bg-white border border-[#E5E0F5] rounded-xl px-3 py-2 text-xs text-[#18181B] focus:outline-none focus:border-[#5B3DF5]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModerationMode(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E5E0F5] text-[#18181B]"
                >
                  {t?.cancelBtn || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#5B3DF5] hover:bg-[#482BD9] text-white"
                >
                  {t?.sendReportBtn || 'Enviar reporte'}
                </button>
              </div>
            </form>
          )}

          {moderationMode === 'block' && !isCounterpartBlocked && (
            <div className="px-4 py-3 bg-[#F5F3FF] border-b border-[#E5E0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-slide-step">
              <div className="text-xs text-[#18181B]">
                <p className="font-extrabold">
                  {(t?.blockConfirmTitle || '¿Bloquear a {name}?').replace(
                    '{name}',
                    activeCounterpart?.name || 'este usuario'
                  )}
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  {t?.blockConfirmDesc ||
                    'Se detendrá el intercambio en este chat y no recibirás nuevas propuestas de esta persona.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModerationMode(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E5E0F5] text-[#18181B]"
                >
                  {t?.cancelBtn || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlockUser}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#18181B] text-white hover:bg-[#27272A]"
                >
                  {t?.confirmBlockBtn || 'Confirmar bloqueo'}
                </button>
              </div>
            </div>
          )}

          {/* Aviso de encuentro seguro */}
          <div className="px-4 py-2 bg-[#F5F3FF]/85 border-b border-[#E5E0F5] flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldAlert className="w-4 h-4 text-[#5B3DF5] shrink-0" />
            <span>
              {t?.meetupSafetyBanner ||
                'Encuentro seguro: coordiná la entrega en un lugar público y concurrido, y evitá compartir tu domicilio exacto.'}
            </span>
          </div>

          {/* Barra de confirmación bilateral del intercambio */}
          {activeChat.status !== 'pending' && (
            <div className="px-4 py-3 bg-[#F5F3FF]/70 border-b border-[#E5E0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold text-[#18181B]">
                    {t?.tradeConfirmationTitle || 'Confirmación del intercambio'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E5E0F5] text-[#6B7280] tabular-nums">
                    {(myConfirmed ? 1 : 0) + (counterpartConfirmed ? 1 : 0)}/2{' '}
                    {t?.confirmedCountSuffix || 'confirmaciones'}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  {isTradeCompleted
                    ? t?.bothConfirmedDesc ||
                      'Ambos confirmaron el intercambio. ¡A disfrutar los rompecabezas!'
                    : myConfirmed
                      ? (
                          t?.waitingCounterpartConfirm ||
                          'Ya confirmaste. Esperando que {name} también confirme.'
                        ).replace('{name}', activeCounterpart?.name || 'la otra persona')
                      : counterpartConfirmed
                        ? (
                            t?.counterpartConfirmedPrompt ||
                            '{name} ya confirmó el intercambio. Confirmá vos para cerrarlo.'
                          ).replace('{name}', activeCounterpart?.name || 'La otra persona')
                        : t?.bothMustConfirmDesc ||
                          'Cuando se pongan de acuerdo, ambos deben confirmar para cerrar el intercambio.'}
                </p>
              </div>

              {isTradeCompleted ? (
                <span className="inline-flex items-center gap-1.5 bg-[#18181B] text-white text-xs font-extrabold px-3.5 py-2 rounded-2xl shrink-0 self-start sm:self-center">
                  <CheckCircle2 className="w-4 h-4 text-[#FFD43B]" />
                  {t?.tradeConfirmedBtnDone || 'Intercambio confirmado'}
                </span>
              ) : myConfirmed ? (
                <span className="inline-flex items-center gap-1.5 bg-white text-[#5B3DF5] border border-[#E5E0F5] text-xs font-bold px-3.5 py-2 rounded-2xl shrink-0 self-start sm:self-center">
                  <Clock className="w-4 h-4" />
                  {t?.waitingOtherBtn || 'Esperando a la otra parte'}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isCounterpartBlocked || isConfirmingTrade}
                  onClick={handleConfirmTrade}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#5B3DF5] hover:bg-[#482BD9] disabled:bg-[#E5E0F5] disabled:text-[#6B7280]/60 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow active:scale-95 shrink-0 self-start sm:self-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t?.confirmTradeBtn || 'Confirmar intercambio'}
                </button>
              )}
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-white">
            {(activeChat.messages || []).map((m, idx) => {
              if (m.isSystem || m.senderId === 'system') {
                return (
                  <div key={idx} className="flex justify-center animate-slide-step">
                    <span className="bg-[#F5F3FF] border border-[#E5E0F5] text-[#5B3DF5] text-[11px] font-bold px-3.5 py-1.5 rounded-full text-center">
                      {m.text}
                    </span>
                  </div>
                );
              }

              const isMe =
                Boolean(currentUser?.id && m.senderId === currentUser.id) ||
                m.sender === currentUser?.name;
              return (
                <div
                  key={idx}
                  className={`flex flex-col animate-slide-step ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed transition-colors ${
                      isMe
                        ? 'bg-[#5B3DF5] text-white rounded-br-xs shadow-2xs'
                        : 'bg-[#F5F3FF] text-[#18181B] border border-[#E5E0F5] rounded-bl-xs'
                    }`}
                  >
                    <p>{m.text}</p>
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 px-1 font-medium">
                    {formatMessageTime(m.sentAt, lang) || m.time}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input para enviar mensaje */}
          <form onSubmit={sendChatMessage} className="shrink-0 p-3 border-t border-[#E5E0F5] flex gap-2 bg-[#F5F3FF]">
            <input
              ref={chatMessageInputRef}
              type="text"
              disabled={isCounterpartBlocked || !isPersistedChat}
              placeholder={
                isCounterpartBlocked
                  ? t?.chatBlockedPlaceholder || 'Este chat está bloqueado.'
                  : !isPersistedChat
                    ? t?.chatConnecting || 'Conectando el chat...'
                  : t?.typeMessage || 'Escribí un mensaje...'
              }
              value={chatMessageInput}
              onChange={(e) => {
                setChatMessageInput(e.target.value);
                setMessageError('');
              }}
              className="flex-1 bg-white border border-[#E5E0F5] disabled:bg-[#F5F3FF] rounded-2xl px-4 py-3 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-colors"
            />
            <button
              type="submit"
              disabled={isCounterpartBlocked || !isPersistedChat || isSendingMessage}
              aria-label={t?.send || 'Enviar'}
              className="bg-[#5B3DF5] hover:bg-[#482BD9] disabled:bg-[#E5E0F5] disabled:text-[#6B7280]/60 text-white p-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow active:scale-95 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {messageError && (
            <p role="alert" className="px-4 pb-3 text-xs text-red-700">
              {messageError}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Conversaciones activas */}
          <div className="space-y-3">
            {activeProposals.length === 0 ? (
              <p className="text-xs text-[#6B7280] bg-white p-6 rounded-3xl border border-[#E5E0F5] text-center shadow-sm animate-modal-pop">
                {t?.noActiveMessages || 'No tenés conversaciones activas en este momento.'}
              </p>
            ) : (
              activeProposals.map((prop) => renderProposalCard(prop, false))
            )}
          </div>

          {/* Conversaciones cerradas o bloqueadas */}
          {closedProposals.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#E5E0F5]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5 px-1">
                <Archive className="w-3.5 h-3.5 text-[#5B3DF5]" />
                {t?.closedChatsTitle || 'Cerrados o bloqueados'} ({closedProposals.length})
              </h3>
              <div className="space-y-2.5">
                {closedProposals.map((prop) => renderProposalCard(prop, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}