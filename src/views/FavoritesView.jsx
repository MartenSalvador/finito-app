import { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import PuzzleDetailModal from '../components/PuzzleDetailModal';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="16">Finito</text></svg>`
  );

export default function FavoritesView({
  puzzles = [],
  favorites = [],
  currentUser,
  toggleFavorite,
  setTradeModalPuzzle,
  setActiveTab,
  onOpenUserProfile,
  t
}) {
  const favList = !currentUser?.id
    ? []
    : Array.isArray(favorites)
      ? favorites
      : Array.isArray(favorites?.[currentUser.id])
        ? favorites[currentUser.id]
        : [];

  const favoritePuzzles = puzzles.filter((p) => favList.includes(p.id));

  // Guardamos el ID para mantener el detalle sincronizado con `puzzles`
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(null);
  const selectedPuzzleDetail =
    puzzles.find((p) => p.id === selectedPuzzleId) || null;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-extrabold flex items-center gap-2 text-[#18181B]">
        <Heart className="w-6 h-6 text-[#5B3DF5] fill-[#5B3DF5]" />
        {t?.favoritesTitle || 'Favoritos'}
      </h2>

      {favoritePuzzles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5E0F5] rounded-3xl shadow-sm space-y-4 animate-modal-pop">
          <p className="text-[#6B7280] text-sm">
            {t?.noFavorites || 'Todavía no guardaste rompecabezas en favoritos.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('explore')}
            className="bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition-all duration-200 shadow-2xs hover:shadow active:scale-95"
          >
            {t?.exploreNow || 'Explorar rompecabezas'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favoritePuzzles.map((puzzle) => {
            const previewImg = puzzle.images?.[0] || puzzle.image || FALLBACK_IMG;
            const isMine = puzzle.userId === currentUser?.id;

            return (
              <div
                key={puzzle.id}
                onClick={() => setSelectedPuzzleId(puzzle.id)}
                className="group bg-white border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-3xl overflow-hidden flex gap-4 p-4 items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              >
                <div className="w-24 h-24 rounded-2xl shrink-0 border border-[#E5E0F5] bg-[#F5F3FF] overflow-hidden">
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
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="inline-block bg-[#FFD43B] text-[#18181B] text-[11px] font-extrabold px-2 py-0.5 rounded-full tabular-nums">
                    {puzzle.pieces} {t?.pieces || 'piezas'}
                  </span>
                  <h4 className="font-bold text-sm text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
                    {puzzle.title}
                  </h4>
                  <p className="text-xs text-[#6B7280] font-medium mb-2 flex items-center gap-1 tabular-nums">
                    <MapPin className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" />
                    <span className="truncate">
                      {puzzle.city} ({puzzle.distanceKm ?? 0} km)
                    </span>
                  </p>
                  {isMine ? (
                    <span className="inline-block bg-[#F5F3FF] text-[#6B7280] font-semibold text-[11px] px-3 py-1 rounded-xl border border-[#E5E0F5]">
                      {t?.yourPost || 'Tu publicación'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeModalPuzzle && setTradeModalPuzzle(puzzle);
                      }}
                      className="bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs px-3.5 py-1.5 rounded-2xl transition-all duration-200 shadow-2xs active:scale-95"
                    >
                      {t?.proposeTrade || 'Proponer Intercambio'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE DETALLE / GALERÍA */}
      {selectedPuzzleDetail && (
        <PuzzleDetailModal
          key={selectedPuzzleDetail.id}
          puzzle={selectedPuzzleDetail}
          currentUser={currentUser}
          favorites={favList}
          toggleFavorite={toggleFavorite}
          onClose={() => setSelectedPuzzleId(null)}
          onOpenUserProfile={onOpenUserProfile}
          onTrade={(puzzleToTrade) => setTradeModalPuzzle && setTradeModalPuzzle(puzzleToTrade)}
          t={t}
        />
      )}
    </div>
  );
}