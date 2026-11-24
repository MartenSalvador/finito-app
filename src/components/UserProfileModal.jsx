import { useState, useEffect } from 'react';
import { X, MapPin, Star, RefreshCw, Puzzle, Eye, Award, ChevronDown } from 'lucide-react';
import { INITIAL_USERS } from '../data/mockUsers';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F5F3FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="sans-serif" font-size="16">Finito</text></svg>`
  );

export default function UserProfileModal({
  userId,
  users = INITIAL_USERS,
  puzzles = [],
  badgesCatalog = [],
  userBadges = {},
  currentUser,
  onClose,
  onSelectPuzzle,
  onTrade,
  t
}) {
  const [badgesOpen, setBadgesOpen] = useState(false);

  const avatarUrl =
    userId && Array.isArray(users)
      ? (() => {
          const found = users.find((u) => u.id === userId);
          return found?.avatar || found?.photo || found?.image || '';
        })()
      : '';

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!userId || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userId, onClose]);

  if (!userId) return null;

  const user = Array.isArray(users) ? users.find((u) => u.id === userId) : null;
  const userPuzzles = Array.isArray(puzzles)
    ? puzzles.filter((p) => p.userId === userId)
    : [];

  const rawBadgeIds = Array.isArray(user?.badges)
    ? user.badges
    : Array.isArray(userBadges)
      ? userBadges
      : userBadges?.[userId] || [];

  const unlockedBadges = rawBadgeIds
    .map((entry) => {
      if (typeof entry === 'object' && entry !== null) return entry;
      return badgesCatalog.find((b) => b.id === entry) || { id: entry, title: String(entry) };
    })
    .filter(Boolean);

  const displayName = user?.name || userPuzzles[0]?.userName || 'Usuario';
  const displayCity = user?.city || userPuzzles[0]?.city || 'Ubicación no disponible';
  const isCurrentUser = currentUser?.id && currentUser.id === userId;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#18181B]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto py-10 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E0F5] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative my-auto animate-modal-pop"
      >

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t?.closeModal || 'Cerrar'}
          className="absolute top-4 right-4 z-10 bg-white hover:bg-[#F5F3FF] text-[#18181B] border border-[#E5E0F5] p-2 rounded-full transition-all duration-200 active:scale-90 shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Perfil */}
        <div className="p-6 bg-[#F5F3FF] border-b border-[#E5E0F5] space-y-4">
          <div className="flex items-start gap-4 pr-8">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-14 h-14 rounded-2xl object-cover bg-white border border-[#E5E0F5] shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#5B3DF5] text-white border border-[#E5E0F5] flex items-center justify-center text-xl font-black shrink-0 shadow-2xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <h2 className="text-lg font-extrabold text-[#18181B] truncate">{displayName}</h2>
              <p className="text-xs text-[#6B7280] font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" />
                <span>
                  {displayCity}
                  {user?.cp ? ` · CP ${user.cp}` : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white border border-[#E5E0F5] rounded-2xl p-2.5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="font-extrabold text-[#18181B] flex items-center justify-center gap-1 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-[#FFD43B] text-[#FFD43B]" />
                <span>{user?.rating ?? '—'}</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">{t?.rating || 'Valoración'}</span>
            </div>

            <div className="bg-white border border-[#E5E0F5] rounded-2xl p-2.5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="font-extrabold text-[#18181B] tabular-nums">
                {typeof user?.tradesCount === 'number' ? user.tradesCount : '—'}
              </div>
              <span className="text-[11px] text-[#6B7280]">{t?.trades || 'Intercambios'}</span>
            </div>

            <div className="bg-white border border-[#E5E0F5] rounded-2xl p-2.5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="font-extrabold text-[#5B3DF5] tabular-nums">{userPuzzles.length}</div>
              <span className="text-[11px] text-[#6B7280]">{t?.availablePuzzles || 'Puzzles'}</span>
            </div>
          </div>

          {/* Medallas compactas y desplegables */}
          {unlockedBadges.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                aria-expanded={badgesOpen}
                onClick={() => setBadgesOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#EBE7FF]/60 border border-[#E5E0F5] text-[#18181B] px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 active:scale-95"
              >
                <Award className="w-3.5 h-3.5 text-[#5B3DF5] shrink-0" />
                <span>{t?.badges || 'Medallas'}</span>
                <span className="bg-[#FFD43B] text-[#18181B] px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums">
                  {unlockedBadges.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${
                    badgesOpen ? 'rotate-180 text-[#5B3DF5]' : ''
                  }`}
                />
              </button>

              {badgesOpen && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 animate-slide-step">
                  {unlockedBadges.map((badge, idx) => {
                    const badgeTitle =
                      (badge.titleKey && t?.[badge.titleKey]) ||
                      badge.title ||
                      badge.name ||
                      badge.id ||
                      '';
                    const badgeDesc =
                      (badge.descKey && t?.[badge.descKey]) ||
                      badge.description ||
                      badge.desc ||
                      '';

                    return (
                      <span
                        key={badge.id || idx}
                        title={badgeDesc || badgeTitle}
                        className="bg-white border border-[#E5E0F5] text-[#18181B] px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Award className="w-3 h-3 text-[#5B3DF5] shrink-0" />
                        <span>{badgeTitle}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Puzzles disponibles de este usuario */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
            <Puzzle className="w-3.5 h-3.5 text-[#5B3DF5]" />
            <span>{t?.userPuzzlesTitle || 'Puzzles disponibles para intercambiar'}</span>
          </h3>

          {userPuzzles.length === 0 ? (
            <p className="text-xs text-[#6B7280] bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-4 text-center">
              {t?.noUserPuzzles || 'Este usuario no tiene rompecabezas publicados actualmente.'}
            </p>
          ) : (
            <div className="space-y-3">
              {userPuzzles.map((item) => {
                const imgSrc = item.images?.[0] || item.image || FALLBACK_IMG;
                return (
                  <div
                    key={item.id}
                    className="group bg-[#F5F3FF] hover:bg-white border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-2xl p-3 flex items-center gap-3 shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <img
                      src={imgSrc}
                      alt={item.title || 'Puzzle'}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMG) {
                          e.currentTarget.src = FALLBACK_IMG;
                        }
                      }}
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-[#E5E0F5] shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-medium">
                        {item.pieces} {t?.pieces || 'piezas'} · {item.status || 'Disponible'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectPuzzle && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            onSelectPuzzle(item);
                          }}
                          title={t?.viewDetail || 'Ver detalle'}
                          className="bg-white hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] p-2 rounded-xl transition-all duration-200 active:scale-90"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {!isCurrentUser && onTrade && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            onTrade(item);
                          }}
                          className="bg-[#5B3DF5] hover:bg-[#482BD9] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-1 shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t?.proposeTrade || 'Intercambiar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}