import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  PlusCircle,
  Puzzle,
  Share2,
  Trash2,
} from 'lucide-react';

export default function ProfilePublicationsSection({
  myPuzzles = [],
  onSelectPuzzle,
  onEditPuzzle,
  onDeletePuzzle,
  setActiveTab,
  t,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleShare = async (e, puzzle) => {
    e.stopPropagation();

    const shareUrl = window.location.href;
    const piecesText = puzzle.pieces ? ` (${puzzle.pieces} ${t?.pieces || 'piezas'})` : '';
    const titleText = puzzle.title || 'Puzzle';
    const shareText =
      t?.sharePuzzleText?.replace('{title}', `${titleText}${piecesText}`) ||
      `¡Mirá este puzzle disponible para intercambio en Finito: ${titleText}${piecesText}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: titleText,
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
      setCopiedId(puzzle.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === puzzle.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  return (
    <div className="bg-white border border-[#E5E0F5] shadow-2xs rounded-3xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F5F3FF] transition-colors duration-200"
      >
        <span className="font-extrabold text-xs text-[#18181B] uppercase tracking-wider flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-[#5B3DF5]" />
          <span>{t?.myPublications || 'Mis Publicaciones'}</span>
          <span className="bg-[#FFD43B] text-[#18181B] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums">
            {myPuzzles.length}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280] transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280] transition-transform duration-200" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-[#E5E0F5] pt-3 animate-slide-step">
          {myPuzzles.length === 0 ? (
            <div className="text-center py-3 space-y-3">
              <p className="text-xs text-[#6B7280]">
                {t?.noMyPuzzles || "You haven't published any puzzles yet. Upload one to start trading!"}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('publish')}
                className="inline-flex items-center gap-1.5 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs hover:shadow"
              >
                <PlusCircle className="w-4 h-4" /> {t?.publishButton || 'Publish a puzzle'}
              </button>
            </div>
          ) : (
            myPuzzles.map((p) => {
              const currentImg = (p.images && p.images[0]) || p.image;
              const isCopied = copiedId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPuzzle && onSelectPuzzle(p)}
                  className="group bg-[#F5F3FF] border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl shrink-0 bg-white border border-[#E5E0F5] overflow-hidden">
                      <img
                        src={currentImg}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-xs sm:text-sm text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
                        {p.title}
                      </h4>
                      <span className="text-[11px] text-[#18181B] font-bold block">
                        <span className="bg-[#FFD43B] px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums">
                          {p.pieces} {t?.pieces || 'piezas'}
                        </span>{' '}
                        <span className="text-[#6B7280] font-medium ml-1">{p.status}</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, p)}
                      className={`p-2 rounded-2xl border transition-all duration-200 active:scale-90 ${
                        isCopied
                          ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                          : 'bg-white hover:bg-[#EBE7FF] text-[#5B3DF5] border-[#E5E0F5]'
                      }`}
                      title={isCopied ? t?.linkCopied || 'Enlace copiado' : t?.share || 'Compartir'}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditPuzzle && onEditPuzzle(p)}
                      className="bg-white hover:bg-[#EBE7FF] text-[#5B3DF5] p-2 rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90"
                      title={t?.editPublication || 'Editar publicación'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            t?.confirmDeletePuzzle || '¿Estás seguro de eliminar esta publicación?'
                          )
                        ) {
                          onDeletePuzzle(p.id);
                        }
                      }}
                      className="bg-white hover:bg-[#EBE7FF] text-[#6B7280] hover:text-[#18181B] p-2 rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90"
                      title={t?.deletePublication || 'Eliminar publicación'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}