import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Images,
  Puzzle,
  Sparkles,
  Star,
} from 'lucide-react';
import UserBadgesSection from '../components/UserBadgesSection';
import UserTradePuzzlesGrid from '../components/UserTradePuzzlesGrid';
import CompletedGallerySection from '../components/profile/CompletedGallerySection';
import CompletedPuzzleModal from '../components/profile/CompletedPuzzleModal';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function UserProfileView({
  userId,
  users = [],
  puzzles = [],
  completedPuzzles = [],
  badgesCatalog = [],
  userBadges = {},
  currentUser,
  onBack,
  onSelectPuzzle,
  onTrade,
  t,
}) {
  const [activeSection, setActiveSection] = useState('trade'); // 'trade' | 'completed'
  const [selectedCompletedPuzzle, setSelectedCompletedPuzzle] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]);

  const targetId = userId || currentUser?.id;
  const profileUser =
    users.find((u) => u.id === targetId) ||
    (currentUser?.id === targetId ? currentUser : null) || {
      id: targetId,
      name: t?.user || 'Usuario',
      city: '',
      cp: '',
      rating: null,
      tradesCount: 0,
      avatar: '',
    };

  const isOwnProfile = Boolean(currentUser?.id && profileUser?.id === currentUser.id);

  const userTradePuzzles = puzzles.filter((p) => p.userId === profileUser.id);
  const userCompletedPuzzles = completedPuzzles.filter((cp) => cp.userId === profileUser.id);

  const unlockedBadgeIds = Array.isArray(userBadges)
    ? userBadges
    : userBadges?.[profileUser.id] || [];

  const unlockedBadges = badgesCatalog.filter((badge) => unlockedBadgeIds.includes(badge.id));

  const locationText = [profileUser.city, profileUser.cp ? `(${profileUser.cp})` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra superior con botón volver */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onBack && onBack()}
          className="bg-white hover:bg-[#F5F3FF] border border-[#E5E0F5] text-[#18181B] px-3.5 py-2 rounded-full font-bold text-xs inline-flex items-center gap-2 transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#5B3DF5]" />
          <span>{t?.back || 'Volver'}</span>
        </button>

        {isOwnProfile && (
          <span className="bg-[#FFD43B] text-[#18181B] px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#18181B]" />
            <span>{t?.myProfile || 'Mi perfil'}</span>
          </span>
        )}
      </div>

      {/* Tarjeta principal: Foto + Info + Estadísticas */}
      <div className="bg-white border border-[#E5E0F5] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {profileUser.avatar ? (
            <img
              src={profileUser.avatar}
              alt={profileUser.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E5E0F5] bg-[#F5F3FF] shrink-0 transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#5B3DF5] text-white font-extrabold text-xl flex items-center justify-center border-2 border-[#E5E0F5] shrink-0 shadow-xs">
              {getInitials(profileUser.name)}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] leading-tight">
                {profileUser.name}
              </h1>

              {profileUser.rating != null && (
                <span className="bg-[#FFD43B] text-[#18181B] px-2.5 py-0.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1 shadow-xs tabular-nums">
                  <Star className="w-3.5 h-3.5 text-[#18181B] fill-[#18181B]" />
                  <span>{Number(profileUser.rating).toFixed(1)}</span>
                </span>
              )}
            </div>

            {locationText && (
              <p className="text-xs text-[#6B7280] font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5B3DF5]" />
                <span>{locationText}</span>
              </p>
            )}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#E5E0F5]">
          <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3 text-center transition-colors duration-200 hover:bg-[#EBE7FF]">
            <p className="text-lg font-extrabold text-[#18181B] tabular-nums">{userTradePuzzles.length}</p>
            <p className="text-[11px] text-[#6B7280] font-bold">
              {t?.forTrade || 'Para cambio'}
            </p>
          </div>

          <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3 text-center transition-colors duration-200 hover:bg-[#EBE7FF]">
            <p className="text-lg font-extrabold text-[#5B3DF5] tabular-nums">
              {profileUser.tradesCount ?? 0}
            </p>
            <p className="text-[11px] text-[#6B7280] font-bold">
              {t?.tradesCompleted || 'Cambios'}
            </p>
          </div>

          <div className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3 text-center transition-colors duration-200 hover:bg-[#EBE7FF]">
            <p className="text-lg font-extrabold text-[#18181B] tabular-nums">{userCompletedPuzzles.length}</p>
            <p className="text-[11px] text-[#6B7280] font-bold">
              {t?.completedPuzzles || 'Armados'}
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Medallas (cerrada por defecto y compacta) */}
      <UserBadgesSection
        key={profileUser.id}
        unlockedBadges={unlockedBadges}
        totalBadgesCount={badgesCatalog.length}
        defaultOpen={false}
        compact={true}
        t={t}
      />

      {/* Selector de sección: Puzzles para intercambio vs Galería de armados */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSection('trade')}
          className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border ${
            activeSection === 'trade'
              ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-xs'
              : 'bg-white text-[#18181B] hover:bg-[#F5F3FF] border-[#E5E0F5]'
          }`}
        >
          <Puzzle className="w-4 h-4" />
          <span>
            {t?.tradePuzzles || 'Para intercambio'} ({userTradePuzzles.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('completed')}
          className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border ${
            activeSection === 'completed'
              ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-xs'
              : 'bg-white text-[#18181B] hover:bg-[#F5F3FF] border-[#E5E0F5]'
          }`}
        >
          <Images className="w-4 h-4" />
          <span>
            {t?.completedGallery || 'Puzzles armados'} ({userCompletedPuzzles.length})
          </span>
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      <div key={activeSection} className="animate-slide-step">
        {activeSection === 'trade' ? (
          <UserTradePuzzlesGrid
            puzzles={userTradePuzzles}
            isOwnProfile={isOwnProfile}
            onSelectPuzzle={onSelectPuzzle}
            onTrade={onTrade}
            t={t}
          />
        ) : (
          <CompletedGallerySection
            userId={profileUser.id}
            completedPuzzles={completedPuzzles}
            onSelectPuzzle={setSelectedCompletedPuzzle}
            allowUpload={false}
            defaultOpen={true}
            t={t}
          />
        )}
      </div>

      <CompletedPuzzleModal
        key={selectedCompletedPuzzle?.id || 'closed'}
        puzzle={selectedCompletedPuzzle}
        onClose={() => setSelectedCompletedPuzzle(null)}
        t={t}
      />
    </div>
  );
}