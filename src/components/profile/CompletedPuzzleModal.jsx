import { useEffect, useState } from 'react';
import { Check, Loader2, Share2, Trash2, X } from 'lucide-react';

export default function CompletedPuzzleModal({
  puzzle,
  onClose,
  onDelete,
  t,
}) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!puzzle || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [puzzle, onClose, isDeleting]);

  if (!puzzle) return null;

  const imgSrc = puzzle.image || puzzle.images?.[0];

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const piecesText = puzzle.pieces ? ` (${puzzle.pieces} ${t?.pieces || 'piezas'})` : '';
    const shareText =
      t?.shareCompletedText?.replace('{title}', `${puzzle.title}${piecesText}`) ||
      `¡Mirá este puzzle que armé en Finito: ${puzzle.title}${piecesText}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: puzzle.title || 'Finito',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(puzzle.id);
      onClose?.();
    } catch (err) {
      console.error('Error al eliminar el armado:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isDeleting) onClose?.();
      }}
      className="fixed inset-0 z-50 bg-[#18181B]/45 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E0F5] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5 animate-modal-pop"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E0F5] pb-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-[#18181B] truncate">
              {puzzle.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] font-medium mt-1">
              {puzzle.pieces && (
                <span className="font-extrabold text-[#18181B] bg-[#FFD43B] px-2.5 py-0.5 rounded-full tabular-nums">
                  {puzzle.pieces} {t?.pieces || 'piezas'}
                </span>
              )}
              {puzzle.pieces && puzzle.completedAt && <span>·</span>}
              {puzzle.completedAt && (
                <span className="tabular-nums">{puzzle.completedAt}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleShare}
              title={copied ? t?.linkCopied || 'Enlace copiado' : t?.share || 'Compartir'}
              className={`px-2.5 py-2 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-90 inline-flex items-center gap-1.5 disabled:opacity-60 ${
                copied
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] hover:text-[#5B3DF5] border-[#E5E0F5]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">{t?.copied || 'Copiado'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#5B3DF5]" />
                  <span className="hidden sm:inline">{t?.share || 'Compartir'}</span>
                </>
              )}
            </button>

            {onDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClick}
                className="p-2 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#5B3DF5] rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90 disabled:opacity-60"
                title={t?.deleteCompletedBtn || 'Eliminar'}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              aria-label={t?.closeModal || 'Cerrar'}
              className="p-2 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90 disabled:opacity-60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-2.5 flex items-center justify-center max-h-[65vh] overflow-hidden">
          <img
            src={imgSrc}
            alt={puzzle.title}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl transition-transform duration-300 hover:scale-[1.01]"
          />
        </div>

        {puzzle.note && (
          <p className="text-xs sm:text-sm text-[#18181B] bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3.5 leading-relaxed">
            {puzzle.note}
          </p>
        )}
      </div>
    </div>
  );
}