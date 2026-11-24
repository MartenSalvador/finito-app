import { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, AlertCircle, Send, ShieldCheck } from 'lucide-react';
import { INITIAL_USERS } from '../data/mockUsers';

export default function TradeModal({
  puzzle,
  currentUser,
  puzzles = [],
  trades = [],
  users = INITIAL_USERS,
  onClose,
  onPropose,
  t,
}) {
  // IDs de puzzles propios actualmente involucrados en intercambios activos
  const lockedPuzzleIds = useMemo(() => {
    const locked = new Set();
    if (!Array.isArray(trades)) return locked;

    for (const tr of trades) {
      const status = tr?.status || 'pending';
      if (status === 'pending' || status === 'accepted') {
        if (tr.offeredPuzzleId) locked.add(tr.offeredPuzzleId);
        if (tr.requestedPuzzleId) locked.add(tr.requestedPuzzleId);
      }
    }
    return locked;
  }, [trades]);

  // Filtramos los puzzles publicados por el usuario actual que no estén bloqueados
  const myPuzzles = useMemo(
    () =>
      puzzles.filter(
        (p) =>
          p.userId === currentUser?.id &&
          p.id !== puzzle?.id &&
          !lockedPuzzleIds.has(p.id)
      ),
    [puzzles, currentUser?.id, puzzle?.id, lockedPuzzleIds]
  );

  const [selectedPuzzleId, setSelectedPuzzleId] = useState(() => myPuzzles[0]?.id || '');
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!puzzle) return null;

  const selectedPuzzle =
    myPuzzles.find((p) => p.id === selectedPuzzleId) || myPuzzles[0] || null;

  const senderProfile = Array.isArray(users)
    ? users.find((u) => u.id === currentUser?.id)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const offeredPuzzle = selectedPuzzle;
    if (!offeredPuzzle) return;

    const trimmedMsg = initialMessage.trim();
    const senderName = currentUser?.name || senderProfile?.name || 'Usuario';
    const senderAvatar =
      currentUser?.avatar ||
      currentUser?.photo ||
      senderProfile?.avatar ||
      senderProfile?.photo ||
      '';
    const senderCity = currentUser?.city || senderProfile?.city || offeredPuzzle.city || '';

    const newProposal = {
      id: `prop-${Date.now()}`,
      senderId: currentUser?.id,
      senderName,
      senderAvatar,
      senderCity,
      receiverId: puzzle.userId,
      receiverName: puzzle.userName || 'Usuario',
      requestedPuzzleId: puzzle.id,
      offeredPuzzleId: offeredPuzzle.id,
      puzzleTargetTitle: puzzle.title,
      puzzleOfferedTitle: offeredPuzzle.title,
      status: 'pending',
      read: false,
      messages: trimmedMsg
        ? [
            {
              senderId: currentUser?.id,
              sender: senderName,
              text: trimmedMsg,
              time: t?.justNow || 'Ahora',
            },
          ]
        : [],
    };

    onPropose && onPropose(newProposal);
  };

  const previewImg = puzzle.images?.[0] || puzzle.image || '';

  return (
    <div
      className="fixed inset-0 bg-[#18181B]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto py-10 animate-fade-in"
      onClick={() => onClose && onClose()}
    >
      <div
        className="bg-white border border-[#E5E0F5] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative my-auto p-6 space-y-5 animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E0F5] pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#F5F3FF] p-2.5 rounded-2xl text-[#5B3DF5] border border-[#E5E0F5]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#18181B] leading-tight">
                {t?.tradeTitle || 'Proponer intercambio'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {t?.tradeWith || 'Intercambio con'}:{' '}
                <span className="text-[#18181B] font-bold">
                  {puzzle.userName || 'Usuario'}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t?.closeBtn || 'Cerrar'}
            className="bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] p-2 rounded-full transition-all duration-200 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Puzzle que quiere recibir */}
        <div className="bg-[#F5F3FF] p-3.5 rounded-2xl border border-[#E5E0F5] flex items-center gap-3 transition-colors duration-200 hover:bg-[#EFEAFF]">
          {previewImg && (
            <img
              src={previewImg}
              alt={puzzle.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E5E0F5] bg-white transition-transform duration-300 hover:scale-105"
            />
          )}
          <div className="min-w-0">
            <span className="inline-block text-[10px] uppercase tracking-wider bg-[#FFD43B] text-[#18181B] font-extrabold px-2 py-0.5 rounded-full mb-1">
              {t?.wantThisPuzzle || 'Te interesa este puzzle'}
            </span>
            <p className="text-sm font-bold text-[#18181B] truncate">{puzzle.title}</p>
            <span className="text-xs text-[#6B7280] font-medium">
              {puzzle.pieces} {t?.pieces || 'piezas'} · {puzzle.city}
            </span>
          </div>
        </div>

        {/* Formulario de selección */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#18181B] uppercase tracking-wider">
              {t?.selectYourPuzzle || 'Elegí uno de tus rompecabezas para ofrecer'}
            </label>

            {myPuzzles.length === 0 ? (
              <div className="bg-[#F5F3FF] border border-[#E5E0F5] text-[#18181B] p-3.5 rounded-2xl text-xs flex items-start gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-[#5B3DF5] shrink-0 mt-0.5" />
                <span>
                  {t?.noPuzzlesToOffer ||
                    'No tenés rompecabezas disponibles para ofrecer en este momento.'}
                </span>
              </div>
            ) : (
              <>
                <select
                  value={selectedPuzzle?.id || ''}
                  onChange={(e) => setSelectedPuzzleId(e.target.value)}
                  className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] font-medium focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer"
                >
                  {myPuzzles.map((myP) => (
                    <option key={myP.id} value={myP.id}>
                      {myP.title} ({myP.pieces} {t?.pieces || 'piezas'})
                    </option>
                  ))}
                </select>

                {selectedPuzzle && (
                  <div className="bg-[#F5F3FF]/70 border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs text-[#6B7280] flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#18181B] truncate">
                      {t?.offeringLabel || 'Ofrecés'}: {selectedPuzzle.title}
                    </span>
                    <span className="shrink-0 font-bold text-[#5B3DF5]">
                      {selectedPuzzle.pieces} {t?.pieces || 'piezas'}
                      {selectedPuzzle.condition ? ` · ${selectedPuzzle.condition}` : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#18181B] uppercase tracking-wider">
              {t?.optionalMessage || 'Mensaje opcional'}
            </label>
            <textarea
              rows="3"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder={
                t?.tradeMsgPlaceholder ||
                'Contale cómo está tu puzzle o dónde podés coordinar...'
              }
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3.5 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 resize-none"
            />
          </div>

          <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-[11px] text-[#6B7280] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5B3DF5] shrink-0 mt-0.5" />
            <span>
              {t?.tradeSafetyTip ||
                'Evitá pasar direcciones exactas o datos personales de entrada; coordiná entregas en lugares públicos y visibles.'}
            </span>
          </div>

          {/* Botones */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold text-sm py-3 rounded-2xl transition-all duration-200 active:scale-95"
            >
              {t?.cancelBtn || 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={myPuzzles.length === 0}
              className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] disabled:bg-[#E5E0F5] disabled:text-[#6B7280]/60 text-white font-bold text-sm py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-2xs hover:shadow-md disabled:shadow-none disabled:active:scale-100"
            >
              <Send className="w-4 h-4" />
              {t?.sendProposalBtn || 'Enviar propuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}