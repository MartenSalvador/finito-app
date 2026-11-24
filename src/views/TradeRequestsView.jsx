import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Inbox,
  MapPin,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import PuzzleDetailModal from '../components/PuzzleDetailModal';
import { INITIAL_USERS } from '../data/mockUsers';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

const FALLBACK_PUZZLE_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="14">Finito</text></svg>`
  );

const FALLBACK_AVATAR_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#F5F3FF"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="11">Finito</text></svg>`
  );

function getExpiresAt(trade) {
  if (typeof trade?.expiresAt === 'number') return trade.expiresAt;
  if (typeof trade?.createdAt === 'number') {
    return trade.createdAt + FORTY_EIGHT_HOURS_MS;
  }
  return null;
}

function getEffectiveStatus(trade, now) {
  const rawStatus = trade?.status || 'pending';
  const expiresAt = getExpiresAt(trade);

  if (rawStatus === 'pending' && expiresAt && now >= expiresAt) {
    return 'expired';
  }
  return rawStatus;
}

function formatRemainingTime(expiresAt, now, t) {
  if (!expiresAt) return t?.window48h || 'Ventana de 48 h';
  const diff = Math.max(0, expiresAt - now);
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0 && minutes <= 0) {
    return t?.expiredLabel || 'Vencida';
  }
  if (hours === 0) {
    return `${minutes}m ${t?.remainingSuffix || 'restantes'}`;
  }
  return `${hours}h ${minutes}m ${t?.remainingSuffix || 'restantes'}`;
}

function getStatusBadge(status, t) {
  switch (status) {
    case 'accepted':
      return {
        label: t?.acceptedProposal || 'Aceptada',
        className: 'bg-[#5B3DF5] text-white',
      };
    case 'completed':
    case 'confirmed':
      return {
        label: t?.completedTrade || 'Confirmado',
        className: 'bg-[#18181B] text-white',
      };
    case 'rejected':
      return {
        label: t?.rejectedProposal || 'Rechazada',
        className: 'bg-[#F5F3FF] text-[#6B7280] border border-[#E5E0F5]',
      };
    case 'expired':
      return {
        label: t?.expiredProposal || 'Vencida (48h)',
        className: 'bg-[#F5F3FF] text-[#6B7280] border border-[#E5E0F5]',
      };
    case 'pending':
    default:
      return {
        label: t?.pendingProposal || 'Pendiente',
        className: 'bg-[#FFD43B] text-[#18181B]',
      };
  }
}

function SenderAvatar({ name, avatar }) {
  const [broken, setBroken] = useState(false);

  if (avatar && !broken) {
    return (
      <img
        src={avatar}
        alt={name || 'Finito'}
        onError={() => setBroken(true)}
        className="w-10 h-10 rounded-full object-cover border border-[#E5E0F5] shrink-0 bg-[#F5F3FF]"
      />
    );
  }

  return (
    <div
      title={name || 'Finito'}
      className="w-10 h-10 rounded-full bg-[#F5F3FF] border border-[#E5E0F5] flex items-center justify-center text-xs font-extrabold text-[#5B3DF5] shrink-0"
    >
      {(name || 'F').charAt(0).toUpperCase()}
    </div>
  );
}

export default function TradeRequestsView({
  incomingTrades = [],
  trades = null,
  puzzles = [],
  users = INITIAL_USERS,
  currentUser,
  favorites,
  toggleFavorite,
  onAcceptTrade,
  onRejectTrade,
  onOpenChat,
  onOpenUserProfile,
  t,
}) {
  const [selectedPuzzleDetail, setSelectedPuzzleDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const allSourceTrades = Array.isArray(trades) ? trades : incomingTrades;

  const { pendingIncoming, sentProposals } = useMemo(() => {
    if (!currentUser?.id || !Array.isArray(allSourceTrades)) {
      return { pendingIncoming: [], sentProposals: [] };
    }

    const incoming = [];
    const outgoing = [];

    for (const tr of allSourceTrades) {
      const senderId = tr.sender?.id || tr.senderId;
      const effectiveStatus = getEffectiveStatus(tr, now);

      if (senderId === currentUser.id) {
        outgoing.push({ ...tr, _effectiveStatus: effectiveStatus });
        continue;
      }

      if (effectiveStatus !== 'pending') continue;

      const explicitTargetId = tr.targetUserId || tr.receiverId || tr.ownerId;
      if (explicitTargetId) {
        if (explicitTargetId === currentUser.id) {
          incoming.push({ ...tr, _effectiveStatus: effectiveStatus });
        }
        continue;
      }

      const foundRequested = puzzles.find((p) => p.id === tr.requestedPuzzleId);
      const requested = foundRequested || tr.requestedPuzzle;
      const ownerId =
        requested?.userId ||
        requested?.ownerId ||
        tr.requestedPuzzle?.userId;

      if (ownerId === currentUser.id) {
        incoming.push({ ...tr, _effectiveStatus: effectiveStatus });
      }
    }

    return {
      pendingIncoming: incoming,
      sentProposals: outgoing,
    };
  }, [allSourceTrades, currentUser, puzzles, now]);

  const handleOpenProfile = (userId) => {
    if (!userId || !onOpenUserProfile) return;
    setSelectedPuzzleDetail(null);
    onOpenUserProfile(userId);
  };

  const renderTradeCard = (trade, mode) => {
    const isIncoming = mode === 'incoming';
    const effectiveStatus = trade._effectiveStatus || getEffectiveStatus(trade, now);
    const expiresAt = getExpiresAt(trade);
    const remainingText = formatRemainingTime(expiresAt, now, t);
    const badge = getStatusBadge(effectiveStatus, t);

    const foundRequested = puzzles.find((p) => p.id === trade.requestedPuzzleId);
    const foundOffered = puzzles.find((p) => p.id === trade.offeredPuzzleId);

    const requested = foundRequested || trade.requestedPuzzle;
    const offered = foundOffered || trade.offeredPuzzle;

    const counterpartyId = isIncoming
      ? trade.sender?.id || trade.senderId || null
      : trade.targetUserId || trade.receiverId || requested?.userId || null;

    const counterpartyProfile = Array.isArray(users)
      ? users.find((u) => u.id === counterpartyId)
      : null;

    const counterpartyInfo = {
      id: counterpartyId,
      name: isIncoming
        ? trade.sender?.name || trade.senderName || counterpartyProfile?.name || 'Usuario'
        : counterpartyProfile?.name || trade.receiverName || 'Usuario',
      city: isIncoming
        ? trade.sender?.city || trade.senderCity || counterpartyProfile?.city || offered?.city || ''
        : counterpartyProfile?.city || requested?.city || '',
      avatar: isIncoming
        ? trade.sender?.avatar ||
          trade.senderAvatar ||
          counterpartyProfile?.avatar ||
          counterpartyProfile?.photo ||
          ''
        : counterpartyProfile?.avatar || counterpartyProfile?.photo || '',
    };

    const initialText = trade.message || trade.messages?.[0]?.text || '';

    if (!requested || !offered) {
      return (
        <div
          key={trade.id}
          className="bg-white border border-[#E5E0F5] rounded-3xl p-5 shadow-sm space-y-3 animate-modal-pop"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-xs text-[#18181B]">
              {counterpartyInfo.name}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {t?.missingTradePuzzle || 'No se encontraron los rompecabezas asociados a esta solicitud.'}
          </p>
          {isIncoming && effectiveStatus === 'pending' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onRejectTrade && onRejectTrade(trade.id)}
                className="bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold px-3.5 py-2 rounded-full transition-all duration-200 active:scale-95 text-xs flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#5B3DF5]" /> {t?.rejectTrade || 'Rechazar'}
              </button>
            </div>
          )}
        </div>
      );
    }

    const leftPuzzle = isIncoming ? requested : offered;
    const rightPuzzle = isIncoming ? offered : requested;

    const leftLabel = isIncoming
      ? t?.yourPuzzle || 'Tu puzzle'
      : t?.yourOfferedPuzzle || 'Ofrecés';
    const rightLabel = isIncoming
      ? t?.offeredPuzzle || 'Te ofrecen'
      : t?.requestedPuzzle || 'Pedís';

    const leftImg = leftPuzzle.images?.[0] || leftPuzzle.image || FALLBACK_PUZZLE_IMG;
    const rightImg = rightPuzzle.images?.[0] || rightPuzzle.image || FALLBACK_PUZZLE_IMG;

    return (
      <div
        key={trade.id}
        className="bg-white border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 space-y-4 transition-all duration-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E0F5] pb-3">
          <button
            type="button"
            disabled={!counterpartyInfo.id || !onOpenUserProfile}
            onClick={() => handleOpenProfile(counterpartyInfo.id)}
            className="flex items-center gap-3 min-w-0 text-left group disabled:cursor-default"
          >
            <SenderAvatar
              name={counterpartyInfo.name}
              avatar={counterpartyInfo.avatar || FALLBACK_AVATAR_IMG}
            />
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                {isIncoming
                  ? t?.sentByLabel || 'Te propone'
                  : t?.sentToLabel || 'Para'}
              </span>
              <h4 className="font-bold text-xs text-[#18181B] truncate group-hover:text-[#5B3DF5] group-hover:underline transition-colors">
                {counterpartyInfo.name}
              </h4>
              {counterpartyInfo.city && (
                <span className="text-[10px] text-[#6B7280] font-medium flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#5B3DF5] shrink-0" /> {counterpartyInfo.city}
                </span>
              )}
            </div>
          </button>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${badge.className}`}>
              {badge.label}
            </span>
            {effectiveStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5B3DF5] bg-[#F5F3FF] border border-[#E5E0F5] px-2 py-0.5 rounded-full tabular-nums">
                <Clock className="w-3 h-3" />
                {remainingText}
              </span>
            )}
          </div>
        </div>

        {/* Comparación visual */}
        <div className="grid grid-cols-2 gap-3 items-center bg-[#F5F3FF] p-3 rounded-2xl border border-[#E5E0F5]">
          <div
            onClick={() => setSelectedPuzzleDetail(leftPuzzle)}
            className="space-y-1 text-center cursor-pointer group p-2 rounded-xl hover:bg-white transition-colors duration-200"
          >
            <span className="text-[10px] uppercase font-extrabold text-[#6B7280] block">
              {leftLabel}
            </span>
            <div className="relative inline-block overflow-hidden rounded-xl border border-[#E5E0F5] bg-white shadow-2xs">
              <img
                src={leftImg}
                alt={leftPuzzle.title || 'Puzzle'}
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_PUZZLE_IMG) {
                    e.currentTarget.src = FALLBACK_PUZZLE_IMG;
                  }
                }}
                className="w-20 h-20 object-cover mx-auto transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h5 className="font-bold text-xs text-[#18181B] line-clamp-1 group-hover:text-[#5B3DF5] group-hover:underline transition-colors">
              {leftPuzzle.title}
            </h5>
            <span className="text-[10px] text-[#6B7280] font-medium tabular-nums">
              {leftPuzzle.pieces} {t?.pieces || 'piezas'}
            </span>
          </div>

          <div
            onClick={() => setSelectedPuzzleDetail(rightPuzzle)}
            className="space-y-1 text-center relative cursor-pointer group p-2 rounded-xl hover:bg-white transition-colors duration-200"
          >
            <div className="absolute -left-4.5 top-1/2 -translate-y-1/2 bg-white border border-[#E5E0F5] p-1.5 rounded-full shadow-xs text-[#5B3DF5] z-10">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            <span className="text-[10px] uppercase font-extrabold text-[#5B3DF5] block">
              {rightLabel}
            </span>
            <div className="relative inline-block overflow-hidden rounded-xl border border-[#E5E0F5] bg-white shadow-2xs">
              <img
                src={rightImg}
                alt={rightPuzzle.title || 'Puzzle'}
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_PUZZLE_IMG) {
                    e.currentTarget.src = FALLBACK_PUZZLE_IMG;
                  }
                }}
                className="w-20 h-20 object-cover mx-auto transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h5 className="font-bold text-xs text-[#18181B] line-clamp-1 group-hover:text-[#5B3DF5] group-hover:underline transition-colors">
              {rightPuzzle.title}
            </h5>
            <span className="text-[10px] text-[#6B7280] font-medium tabular-nums">
              {rightPuzzle.pieces} {t?.pieces || 'piezas'}
            </span>
          </div>
        </div>

        {/* Mensaje */}
        {initialText && (
          <div className="bg-[#F5F3FF] p-3 rounded-2xl border border-[#E5E0F5] text-xs text-[#18181B] italic">
            <span className="font-extrabold not-italic block text-[10px] text-[#6B7280] uppercase mb-0.5">
              {t?.messageLabel || 'Mensaje'}
            </span>
            "{initialText}"
          </div>
        )}

        {/* Acciones */}
        {isIncoming && effectiveStatus === 'pending' ? (
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onRejectTrade && onRejectTrade(trade.id)}
              className="flex-1 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold py-2.5 rounded-2xl transition-all duration-200 active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4 text-[#5B3DF5]" /> {t?.rejectTrade || 'Rechazar'}
            </button>
            <button
              type="button"
              onClick={() => onAcceptTrade && onAcceptTrade(trade.id)}
              className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-2.5 rounded-2xl transition-all duration-200 shadow-xs hover:shadow active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> {t?.acceptTrade || 'Aceptar'}
            </button>
          </div>
        ) : effectiveStatus === 'accepted' && onOpenChat ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onOpenChat(trade)}
              className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-2.5 rounded-2xl transition-all duration-200 shadow-xs hover:shadow active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              {t?.goToChat || 'Ir al chat para acordar'}
            </button>
          </div>
        ) : (effectiveStatus === 'completed' || effectiveStatus === 'confirmed') ? (
          <div className="pt-1 space-y-2">
            <p className="text-[11px] text-[#6B7280] text-center">
              {t?.tradeCompletedNotice || 'Intercambio confirmado y cerrado.'}
            </p>
            {onOpenChat && (
              <button
                type="button"
                onClick={() => onOpenChat(trade)}
                className="w-full bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold py-2 rounded-2xl transition-all duration-200 active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-[#5B3DF5]" />
                {t?.viewChatBtn || 'Ver chat'}
              </button>
            )}
          </div>
        ) : !isIncoming && effectiveStatus === 'pending' ? (
          <p className="text-[11px] text-[#6B7280] text-center pt-0.5">
            {t?.waitingResponse48h || 'Esperando respuesta dentro de las 48 horas.'}
          </p>
        ) : (effectiveStatus === 'expired' || effectiveStatus === 'rejected') ? (
          <p className="text-[11px] text-[#6B7280] text-center pt-0.5">
            {effectiveStatus === 'expired'
              ? t?.expiredNotice || 'Pasaron 48 horas sin respuesta y la propuesta quedó vencida.'
              : t?.rejectedNotice || 'Esta propuesta fue rechazada.'}
          </p>
        ) : null}
      </div>
    );
  };

  const currentList = activeTab === 'incoming' ? pendingIncoming : sentProposals;

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      {/* Selector Recibidas / Enviadas */}
      <div className="bg-white border border-[#E5E0F5] rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-200 ${
            activeTab === 'incoming'
              ? 'bg-[#5B3DF5] text-white shadow-2xs'
              : 'text-[#6B7280] hover:text-[#18181B] hover:bg-[#F5F3FF]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>{t?.incomingProposalsTab || 'Recibidas'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] tabular-nums ${
              activeTab === 'incoming'
                ? 'bg-[#FFD43B] text-[#18181B]'
                : 'bg-[#F5F3FF] text-[#18181B]'
            }`}
          >
            {pendingIncoming.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-200 ${
            activeTab === 'outgoing'
              ? 'bg-[#5B3DF5] text-white shadow-2xs'
              : 'text-[#6B7280] hover:text-[#18181B] hover:bg-[#F5F3FF]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t?.outgoingProposalsTab || 'Enviadas'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] tabular-nums ${
              activeTab === 'outgoing'
                ? 'bg-[#FFD43B] text-[#18181B]'
                : 'bg-[#F5F3FF] text-[#18181B]'
            }`}
          >
            {sentProposals.length}
          </span>
        </button>
      </div>

      <h3 className="font-extrabold text-xs text-[#6B7280] uppercase tracking-wider px-1">
        {activeTab === 'incoming'
          ? t?.tradeRequestsTitle || 'Solicitudes de Intercambio'
          : t?.sentProposalsTitle || 'Propuestas Enviadas'}
      </h3>

      {currentList.length === 0 ? (
        <div className="bg-white border border-[#E5E0F5] rounded-3xl p-8 text-center space-y-3 shadow-sm animate-modal-pop">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#E5E0F5] flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6 text-[#5B3DF5]" />
          </div>
          <h3 className="font-extrabold text-sm text-[#18181B]">
            {activeTab === 'incoming'
              ? t?.noTradesTitle || 'No tenés solicitudes pendientes'
              : t?.noSentProposalsTitle || 'Todavía no enviaste propuestas'}
          </h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            {activeTab === 'incoming'
              ? t?.noTradesSubtitle ||
                'Cuando alguien quiera intercambiar uno de tus rompecabezas, va a aparecer acá.'
              : t?.noSentProposalsSubtitle ||
                'Cuando propongas un intercambio desde un rompecabezas, vas a ver acá el estado y el tiempo de 48 horas.'}
          </p>
        </div>
      ) : (
        currentList.map((trade) => renderTradeCard(trade, activeTab))
      )}

      {selectedPuzzleDetail && (
        <PuzzleDetailModal
          key={selectedPuzzleDetail.id}
          puzzle={selectedPuzzleDetail}
          currentUser={currentUser}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onClose={() => setSelectedPuzzleDetail(null)}
          onOpenUserProfile={handleOpenProfile}
          t={t}
        />
      )}
    </div>
  );
}