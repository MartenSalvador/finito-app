import { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  CheckCircle,
  Heart,
  RefreshCw,
  Star,
  ChevronRight,
  Share2,
  Check,
} from 'lucide-react';
import { INITIAL_USERS } from '../data/mockUsers';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="16">Finito</text></svg>`
  );

export default function PuzzleDetailModal({
  puzzle,
  currentUser,
  favorites,
  toggleFavorite,
  onClose,
  onTrade,
  onOpenUserProfile,
  users = INITIAL_USERS,
  t
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [avatarError, setAvatarError] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawImages =
    puzzle && Array.isArray(puzzle.images) && puzzle.images.length > 0
      ? puzzle.images
      : puzzle?.image
        ? [puzzle.image]
        : [FALLBACK_IMG];

  useEffect(() => {
    setActiveImageIndex(0);
    setAvatarError(false);
    setCopied(false);
  }, [puzzle?.id]);

  useEffect(() => {
    if (!puzzle) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (rawImages.length > 1 && e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % rawImages.length);
      } else if (rawImages.length > 1 && e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + rawImages.length) % rawImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [puzzle, onClose, rawImages.length]);

  if (!puzzle) return null;

  const ownerProfile =
    Array.isArray(users)
      ? users.find((u) => u.id === puzzle.userId)
      : null;

  const ownerAvatar =
    ownerProfile?.avatar || ownerProfile?.photo || ownerProfile?.image || '';

  const currentImage = rawImages[activeImageIndex] || rawImages[0];

  const isFav = Array.isArray(favorites) ? favorites.includes(puzzle.id) : false;
  const isMine = currentUser && puzzle.userId ? puzzle.userId === currentUser.id : false;

  const ownerName = puzzle.userName || ownerProfile?.name || 'Usuario';
  const ownerCity = puzzle.city || ownerProfile?.city || 'Desconocido';
  const displayDistance = puzzle.computedDistanceKm ?? puzzle.distanceKm ?? 0;

  const handleOpenProfile = () => {
    if (!puzzle.userId) return;
    onClose?.();
    onOpenUserProfile?.(puzzle.userId);
  };

  const handleShare = async () => {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#18181B]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto py-10 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E0F5] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto animate-modal-pop"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t?.closeModal || 'Cerrar'}
          className="absolute top-4 right-4 z-10 bg-white/95 hover:bg-[#F5F3FF] text-[#18181B] border border-[#E5E0F5] p-2 rounded-full backdrop-blur-xs transition-all duration-200 active:scale-90 shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Galería de Fotos */}
        <div className="relative h-72 sm:h-80 bg-[#F5F3FF] overflow-hidden">
          <img
            key={activeImageIndex}
            src={currentImage}
            alt={puzzle.title || 'Puzzle'}
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_IMG) {
                e.currentTarget.src = FALLBACK_IMG;
              }
            }}
            className="w-full h-full object-cover animate-slide-step"
          />

          <button
            type="button"
            onClick={() => toggleFavorite?.(puzzle.id)}
            aria-pressed={isFav}
            title={t?.favorite || 'Favorito'}
            className="absolute top-4 left-4 bg-white/95 hover:bg-[#F5F3FF] backdrop-blur-xs p-2.5 rounded-full text-[#6B7280] hover:text-[#5B3DF5] transition-all duration-200 active:scale-90 shadow-2xs border border-[#E5E0F5]"
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-200 ${
                isFav ? 'fill-[#5B3DF5] text-[#5B3DF5] scale-110' : ''
              }`}
            />
          </button>

          <span className="absolute bottom-4 left-4 bg-[#FFD43B] px-3 py-1 rounded-full text-xs font-extrabold text-[#18181B] shadow-2xs tabular-nums">
            {puzzle.pieces ?? '?'} {t?.pieces || 'piezas'}
          </span>
        </div>

        {/* Miniaturas de Fotos (Si hay más de una) */}
        {rawImages.length > 1 && (
          <div className="flex gap-2 p-3 bg-[#F5F3FF] overflow-x-auto border-b border-[#E5E0F5]">
            {rawImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 active:scale-95 ${
                  activeImageIndex === idx
                    ? 'border-[#5B3DF5] scale-105 shadow-2xs'
                    : 'border-transparent opacity-65 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`${puzzle.title || 'Puzzle'} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Información Detallada */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1 font-medium tabular-nums min-w-0 truncate">
              <MapPin className="w-4 h-4 text-[#5B3DF5] shrink-0" />
              <span className="truncate">
                {ownerCity} ({displayDistance} km)
              </span>
            </span>

            <button
              type="button"
              onClick={handleShare}
              title={copied ? t?.linkCopied || 'Enlace copiado' : t?.share || 'Compartir'}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 inline-flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] hover:text-[#5B3DF5] border-[#E5E0F5]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t?.copied || 'Copiado'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  <span>{t?.share || 'Compartir'}</span>
                </>
              )}
            </button>
          </div>

          <h2 className="text-xl font-extrabold text-[#18181B] leading-snug">
            {puzzle.title || 'Sin título'}
          </h2>

          {/* Info del dueño visible + acceso directo a su perfil */}
          <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors duration-200 hover:bg-[#EFEAFF]">
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-2.5 text-left group min-w-0 flex-1 active:scale-[0.99] transition-transform"
            >
              {ownerAvatar && !avatarError ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-full object-cover bg-white border border-[#E5E0F5] shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#5B3DF5] text-white border border-[#E5E0F5] flex items-center justify-center text-xs font-extrabold shrink-0">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
                  <span className="truncate">{ownerName}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {ownerCity}
                  {ownerProfile?.cp ? ` · CP ${ownerProfile.cp}` : ''}
                  {typeof ownerProfile?.tradesCount === 'number'
                    ? ` · ${ownerProfile.tradesCount} ${t?.trades || 'intercambios'}`
                    : ''}
                </p>
              </div>
            </button>

            {ownerProfile?.rating && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#E5E0F5] px-2.5 py-1 rounded-full text-xs font-extrabold text-[#18181B] shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#FFD43B] text-[#FFD43B]" />
                {ownerProfile.rating}
              </span>
            )}
          </div>

          <div className="bg-[#F5F3FF] p-3 rounded-2xl border border-[#E5E0F5] flex items-center gap-2 text-xs text-[#18181B]">
            <CheckCircle className="w-4 h-4 text-[#5B3DF5] shrink-0" />
            <span>
              {t?.status || 'Estado'}:{' '}
              <strong className="font-bold">{puzzle.status || 'Disponible'}</strong>
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-extrabold uppercase text-[#6B7280] tracking-wider">
              {t?.ownerDescription || 'Descripción del dueño'}
            </h4>
            <p className="text-sm text-[#18181B] leading-relaxed bg-[#F5F3FF]/80 p-3 rounded-2xl border border-[#E5E0F5]">
              {puzzle.description || 'Sin descripción.'}
            </p>
          </div>

          {/* Botón de acción */}
          <div className="pt-2">
            {isMine ? (
              <div className="w-full bg-[#F5F3FF] border border-[#E5E0F5] text-[#6B7280] text-xs font-semibold py-3 rounded-2xl text-center">
                {t?.yourPost || 'Esta es tu publicación'}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onTrade?.(puzzle);
                }}
                className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-sm py-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t?.proposeTrade || 'Proponer Intercambio'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}