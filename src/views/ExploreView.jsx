import { useState, useEffect } from 'react';
import { Search, Filter, Heart, MapPin, CheckCircle, RefreshCw, Map as MapIcon, Navigation } from 'lucide-react';
import PuzzleDetailModal from '../components/PuzzleDetailModal';
import MapModal from '../components/MapModal';
import UserProfileModal from '../components/UserProfileModal';
import Frase from '../assets/Finito-frase.png';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="16">Finito</text></svg>`
  );

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (![nLat1, nLon1, nLat2, nLon2].every(Number.isFinite)) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) *
      Math.cos(toRad(nLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const PIECE_OPTIONS = ['ALL', '500', '1000', '2000+'];
const DISTANCE_OPTIONS = ['ALL', '10', '20', '50'];

export default function ExploreView({
  puzzles = [],
  favorites = [],
  currentUser,
  toggleFavorite,
  setTradeModalPuzzle,
  onOpenUserProfile,
  t,
}) {
  const favList = !currentUser?.id
    ? []
    : Array.isArray(favorites)
      ? favorites
      : Array.isArray(favorites?.[currentUser.id])
        ? favorites[currentUser.id]
        : [];

  const [filterPieces, setFilterPieces] = useState('ALL');
  const [maxDistance, setMaxDistance] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Controla qué desplegable está abierto: 'pieces' | 'distance' | null
  const [openFilter, setOpenFilter] = useState(null);

  // Estados para modales
  const [selectedPuzzleDetail, setSelectedPuzzleDetail] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (!openFilter) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenFilter(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openFilter]);

  const activePuzzleDetail = selectedPuzzleDetail
    ? puzzles.find((puzzle) => puzzle.id === selectedPuzzleDetail.id) || null
    : null;

  const distanceLabel =
    t?.distance || t?.maxDistance || t?.distanceFilter || t?.range || 'Distancia';

  const toggleFilterPanel = (panelName) => {
    setOpenFilter((prev) => (prev === panelName ? null : panelName));
  };

  const handleClearFilters = () => {
    setFilterPieces('ALL');
    setMaxDistance('ALL');
    setSearchTerm('');
    setOpenFilter(null);
  };

  const handleSelectUserProfile = (userId) => {
    if (!userId) return;
    if (onOpenUserProfile) {
      onOpenUserProfile(userId);
    } else {
      setProfileUserId(userId);
    }
  };

  const otherUsersPuzzles = puzzles.filter((p) => p.userId !== currentUser?.id);

  const puzzlesWithDistance = otherUsersPuzzles.map((p) => {
    const calculated = getDistanceKm(currentUser?.lat, currentUser?.lon, p.lat, p.lon);
    const distance = calculated !== null ? calculated : Number(p.distanceKm ?? 0);
    return { ...p, computedDistanceKm: distance };
  });

  const filteredPuzzles = puzzlesWithDistance.filter((p) => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedTerm ||
      p.title?.toLowerCase().includes(normalizedTerm) ||
      p.city?.toLowerCase().includes(normalizedTerm);

    const matchesPieces =
      filterPieces === 'ALL' ||
      (filterPieces === '500' && p.pieces === 500) ||
      (filterPieces === '1000' && p.pieces === 1000) ||
      (filterPieces === '2000+' && p.pieces >= 2000);

    const matchesDistance =
      maxDistance === 'ALL' || p.computedDistanceKm <= Number(maxDistance);

    return matchesSearch && matchesPieces && matchesDistance;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado con onda del explorador */}
      <div className="bg-white border border-[#E5E0F5] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Banner centrado a todo lo ancho */}
        <div className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-1.5">
          <img
            src={Frase}
            alt={t?.bannerPhrase || t?.appName || 'Finito'}
            className="w-full max-w-lg h-auto max-h-32 object-contain mx-auto transition-transform duration-300 hover:scale-[1.02]"
          />
          <p className="text-sm sm:text-base font-bold text-[#18181B] max-w-xl">
            {t?.bannerPhrase || 'Cada pieza busca su próxima mesa'}
          </p>
        </div>

        {/* Título, subtítulo y contador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight leading-snug">
              {t?.exploreTitle || '¿Qué puzzle armamos hoy?'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {t?.exploreSubtitle || 'Explorá rompecabezas cerca tuyo, mirá su estado y proponé un cambio.'}
            </p>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E0F5]">
            <span className="bg-[#FFD43B] text-[#18181B] text-xs font-extrabold px-3 py-1 rounded-full shadow-xs tabular-nums">
              {filteredPuzzles.length}{' '}
              {filteredPuzzles.length === 1
                ? (t?.puzzleSingular || 'puzzle')
                : (t?.puzzlePlural || 'puzzles')}
            </span>
            {currentUser?.city && (
              <span className="text-[11px] text-[#6B7280] font-semibold">
                {t?.near || 'Cerca de'} {currentUser.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buscador, mapa y botones de filtros */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder={t?.searchPlaceholder || 'Buscar por título, temática o ciudad...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (openFilter) setOpenFilter(null);
              }}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 pl-11 pr-4 py-3 text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white text-sm"
            />
          </div>
          {/* Botón para abrir el Mapa */}
          <button
            type="button"
            onClick={() => {
              setOpenFilter(null);
              setIsMapOpen(true);
            }}
            className="bg-white hover:bg-[#F5F3FF] border border-[#E5E0F5] text-[#18181B] px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all duration-200 shrink-0 shadow-xs hover:shadow-sm active:scale-95"
          >
            <MapIcon className="w-4 h-4 text-[#5B3DF5]" />
            <span className="hidden sm:inline">{t?.map || 'Mapa'}</span>
          </button>
        </div>

        {/* Misma línea: botón Piezas y botón Distancia */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            aria-expanded={openFilter === 'pieces'}
            onClick={() => toggleFilterPanel('pieces')}
            className={`px-3.5 py-2 rounded-full font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 border ${
              openFilter === 'pieces' || filterPieces !== 'ALL'
                ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-xs'
                : 'bg-white text-[#18181B] hover:bg-[#F5F3FF] border-[#E5E0F5]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t?.pieces || 'Piezas'}</span>
            {filterPieces !== 'ALL' && (
              <span className="ml-0.5 bg-[#FFD43B] text-[#18181B] px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums">
                {filterPieces === '2000+' ? '2000+' : `${filterPieces} p.`}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-expanded={openFilter === 'distance'}
            onClick={() => toggleFilterPanel('distance')}
            className={`px-3.5 py-2 rounded-full font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 border ${
              openFilter === 'distance' || maxDistance !== 'ALL'
                ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-xs'
                : 'bg-white text-[#18181B] hover:bg-[#F5F3FF] border-[#E5E0F5]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{distanceLabel}</span>
            {maxDistance !== 'ALL' && (
              <span className="ml-0.5 bg-[#FFD43B] text-[#18181B] px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums">
                {maxDistance} km
              </span>
            )}
          </button>
        </div>

        {/* Desplegable de opciones de Piezas */}
        {openFilter === 'pieces' && (
          <div className="bg-white border border-[#E5E0F5] rounded-2xl p-2.5 shadow-sm flex items-center gap-2 overflow-x-auto text-xs animate-collapse-reveal">
            {PIECE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFilterPieces(type);
                  setOpenFilter(null);
                }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all duration-200 active:scale-95 shrink-0 ${
                  filterPieces === type
                    ? 'bg-[#5B3DF5] text-white shadow-xs'
                    : 'bg-[#F5F3FF] text-[#6B7280] hover:text-[#18181B] border border-[#E5E0F5]'
                }`}
              >
                {type === 'ALL' ? (t?.all || 'Todos') : `${type} p.`}
              </button>
            ))}
          </div>
        )}

        {/* Desplegable de opciones de Distancia */}
        {openFilter === 'distance' && (
          <div className="bg-white border border-[#E5E0F5] rounded-2xl p-2.5 shadow-sm flex items-center gap-2 overflow-x-auto text-xs animate-collapse-reveal">
            {DISTANCE_OPTIONS.map((dist) => (
              <button
                key={dist}
                type="button"
                onClick={() => {
                  setMaxDistance(dist);
                  setOpenFilter(null);
                }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all duration-200 active:scale-95 shrink-0 ${
                  maxDistance === dist
                    ? 'bg-[#5B3DF5] text-white shadow-xs'
                    : 'bg-[#F5F3FF] text-[#6B7280] hover:text-[#18181B] border border-[#E5E0F5]'
                }`}
              >
                {dist === 'ALL' ? (t?.all || 'Todos') : `${t?.upTo || 'Hasta'} ${dist} km`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grilla de Puzzles */}
      {filteredPuzzles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5E0F5] rounded-3xl shadow-sm space-y-3 animate-modal-pop">
          <p className="text-[#6B7280] text-sm">
            {t?.noPuzzlesFound || 'No se encontraron rompecabezas con esos filtros.'}
          </p>
          {(filterPieces !== 'ALL' || maxDistance !== 'ALL' || searchTerm.trim()) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold px-4 py-2 rounded-full text-xs transition-all duration-200 active:scale-95"
            >
              {t?.clearFilters || 'Limpiar filtros'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPuzzles.map((puzzle) => {
            const isFav = favList.includes(puzzle.id);
            const previewImg = puzzle.images?.[0] || puzzle.image || FALLBACK_IMG;

            return (
              <div
                key={puzzle.id}
                className="group bg-white border border-[#E5E0F5] rounded-3xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Contenedor clickeable para abrir el detalle */}
                <div className="cursor-pointer" onClick={() => setSelectedPuzzleDetail(puzzle)}>
                  <div className="relative h-48 bg-[#F5F3FF] overflow-hidden">
                    <img
                      src={previewImg}
                      alt={puzzle.title || 'Puzzle'}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMG) {
                          e.currentTarget.src = FALLBACK_IMG;
                        }
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      aria-pressed={isFav}
                      aria-label={t?.favorite || 'Favorito'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite && toggleFavorite(puzzle.id);
                      }}
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur p-2 rounded-full text-[#6B7280] hover:text-[#5B3DF5] transition-all duration-200 active:scale-90 shadow-xs border border-[#E5E0F5]"
                    >
                      <Heart className={`w-5 h-5 transition-transform duration-200 ${isFav ? 'text-[#5B3DF5] fill-[#5B3DF5] scale-110' : ''}`} />
                    </button>
                    <span className="absolute bottom-3 left-3 bg-[#FFD43B] px-2.5 py-1 rounded-full text-xs font-extrabold text-[#18181B] shadow-xs tabular-nums">
                      {puzzle.pieces} {t?.pieces || 'piezas'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1 font-medium tabular-nums">
                        <MapPin className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" /> {puzzle.city} ({puzzle.computedDistanceKm} km)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUserProfile(puzzle.userId);
                        }}
                        className="text-[#6B7280] hover:text-[#5B3DF5] font-semibold transition-colors text-right truncate"
                      >
                        {t?.owner || 'Owner'}: {puzzle.userName}
                      </button>
                    </div>
                    <h3 className="font-bold text-base text-[#18181B] leading-snug group-hover:text-[#5B3DF5] transition-colors">
                      {puzzle.title}
                    </h3>
                    <p className="text-xs text-[#18181B] bg-[#F5F3FF] px-2.5 py-1.5 rounded-xl border border-[#E5E0F5] inline-flex items-center gap-1.5 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" />
                      <span>{puzzle.status}</span>
                    </p>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{puzzle.description}</p>
                  </div>
                </div>

                {/* Botón inferior */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => setTradeModalPuzzle && setTradeModalPuzzle(puzzle)}
                    className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs py-2.5 rounded-2xl transition-all duration-200 shadow-xs hover:shadow active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t?.proposeTrade || 'Proponer Intercambio'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE DETALLE / GALERÍA */}
      {activePuzzleDetail && (
        <PuzzleDetailModal
          key={activePuzzleDetail.id}
          puzzle={activePuzzleDetail}
          currentUser={currentUser}
          favorites={favList}
          toggleFavorite={toggleFavorite}
          onClose={() => setSelectedPuzzleDetail(null)}
          onTrade={(puzzleToTrade) => setTradeModalPuzzle && setTradeModalPuzzle(puzzleToTrade)}
          onOpenUserProfile={handleSelectUserProfile}
          t={t}
        />
      )}

      {/* MODAL DE PERFIL DE USUARIO */}
      {profileUserId && (
        <UserProfileModal
          key={profileUserId}
          userId={profileUserId}
          puzzles={puzzles}
          currentUser={currentUser}
          onClose={() => setProfileUserId(null)}
          onSelectPuzzle={(puzzle) => setSelectedPuzzleDetail(puzzle)}
          onTrade={(puzzleToTrade) => setTradeModalPuzzle && setTradeModalPuzzle(puzzleToTrade)}
          t={t}
        />
      )}

      {/* MODAL DE MAPA INTERACTIVO */}
      {isMapOpen && (
        <MapModal
          puzzles={puzzlesWithDistance}
          onClose={() => setIsMapOpen(false)}
          onSelectPuzzle={(puzzle) => setSelectedPuzzleDetail(puzzle)}
          t={t}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}