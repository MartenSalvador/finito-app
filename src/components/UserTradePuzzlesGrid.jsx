import { CheckCircle, RefreshCw } from 'lucide-react';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="16">Finito</text></svg>`
  );

export default function UserTradePuzzlesGrid({
  puzzles = [],
  isOwnProfile = false,
  onSelectPuzzle,
  onTrade,
  t,
}) {
  if (puzzles.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-[#E5E0F5] rounded-3xl shadow-sm animate-fade-in">
        <p className="text-xs text-[#6B7280]">
          {t?.noTradePuzzles || 'Este usuario no tiene rompecabezas publicados para intercambio.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
      {puzzles.map((puzzle) => {
        const previewImg = puzzle.images?.[0] || puzzle.image || FALLBACK_IMG;

        return (
          <div
            key={puzzle.id}
            className="group bg-white border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
          >
            <div
              className="cursor-pointer"
              onClick={() => onSelectPuzzle && onSelectPuzzle(puzzle)}
            >
              <div className="relative h-44 bg-[#F5F3FF] overflow-hidden">
                <img
                  src={previewImg}
                  alt={puzzle.title || 'Puzzle'}
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_IMG) {
                      e.currentTarget.src = FALLBACK_IMG;
                    }
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 bg-[#FFD43B] px-2.5 py-1 rounded-full text-xs font-extrabold text-[#18181B] shadow-2xs tabular-nums">
                  {puzzle.pieces} {t?.pieces || 'piezas'}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-base text-[#18181B] group-hover:text-[#5B3DF5] transition-colors leading-snug">
                  {puzzle.title}
                </h3>
                {puzzle.status && (
                  <p className="text-xs text-[#18181B] bg-[#F5F3FF] px-2.5 py-1.5 rounded-xl border border-[#E5E0F5] inline-flex items-center gap-1.5 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" />
                    <span>{puzzle.status}</span>
                  </p>
                )}
                {puzzle.description && (
                  <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                    {puzzle.description}
                  </p>
                )}
              </div>
            </div>

            {!isOwnProfile && onTrade && (
              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => onTrade(puzzle)}
                  className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs py-2.5 rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs hover:shadow-md flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t?.proposeTrade || 'Proponer Intercambio'}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}