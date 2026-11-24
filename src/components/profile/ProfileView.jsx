import { useState } from 'react';
import { Images, Puzzle } from 'lucide-react';
import ProfileHeaderCard from './ProfileHeaderCard';
import UserTradePuzzlesGrid from '../UserTradePuzzlesGrid';
import CompletedGallerySection from './CompletedGallerySection';
import ProfileAccountSection from './ProfileAccountSection';
import CompletedPuzzleModal from './CompletedPuzzleModal';
import EditPuzzleModal from '../EditPuzzleModal';
import PuzzleDetailModal from '../PuzzleDetailModal';

export default function ProfileView({
  currentUser,
  puzzles = [],
  completedPuzzles = [],
  badgesCatalog = [],
  userBadges = {},
  onAddCompletedPuzzle,
  onDeleteCompletedPuzzle,
  setIsLoggedIn,
  onLogout,
  onDeleteAccount,
  onDeletePuzzle,
  onUpdatePuzzle,
  onUpdateProfile,
  onSendFeedback,
  favorites,
  toggleFavorite,
  setTradeModalPuzzle,
  setActiveTab,
  t,
}) {
  const userId = currentUser?.id;
  const myPuzzles = userId ? puzzles.filter((p) => p.userId === userId) : [];
  const myCompletedPuzzles = userId
    ? completedPuzzles.filter((cp) => cp.userId === userId)
    : [];

  const unlockedBadgeIds = Array.isArray(userBadges)
    ? userBadges
    : userBadges?.[userId] || [];
  const unlockedBadges = badgesCatalog.filter((badge) => unlockedBadgeIds.includes(badge.id));

  const [activeSection, setActiveSection] = useState('trade'); // 'trade' | 'completed'
  const [selectedPuzzleDetail, setSelectedPuzzleDetail] = useState(null);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [selectedCompletedPuzzle, setSelectedCompletedPuzzle] = useState(null);

  const handleLogoutClick = () => {
    setActiveSection('trade');
    setSelectedPuzzleDetail(null);
    setEditingPuzzle(null);
    setSelectedCompletedPuzzle(null);
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      setIsLoggedIn?.(false);
      setActiveTab?.('explore');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F5F3FF] border border-[#E5E0F5] rounded-3xl p-3 sm:p-4 text-[#18181B] space-y-4 animate-fade-in">
      <ProfileHeaderCard
        currentUser={currentUser}
        publishedCount={myPuzzles.length}
        completedCount={myCompletedPuzzles.length}
        unlockedBadges={unlockedBadges}
        onUpdateProfile={onUpdateProfile}
        setIsLoggedIn={setIsLoggedIn}
        onLogout={handleLogoutClick}
        t={t}
      />

      {/* Selector de sección igual que en UserProfileView */}
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
            {t?.tradePuzzles || 'Para intercambio'} ({myPuzzles.length})
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
            {t?.completedGallery || 'Puzzles armados'} ({myCompletedPuzzles.length})
          </span>
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      <div key={activeSection} className="animate-slide-step">
        {activeSection === 'trade' ? (
          <UserTradePuzzlesGrid
            puzzles={myPuzzles}
            isOwnProfile={true}
            onSelectPuzzle={setSelectedPuzzleDetail}
            onEditPuzzle={setEditingPuzzle}
            onDeletePuzzle={onDeletePuzzle}
            onTrade={(puzzleToTrade) => setTradeModalPuzzle?.(puzzleToTrade)}
            t={t}
          />
        ) : (
          <CompletedGallerySection
            userId={userId}
            completedPuzzles={completedPuzzles}
            onAddCompletedPuzzle={onAddCompletedPuzzle}
            onDeleteCompletedPuzzle={onDeleteCompletedPuzzle}
            onSelectPuzzle={setSelectedCompletedPuzzle}
            allowUpload={true}
            defaultOpen={true}
            t={t}
          />
        )}
      </div>

      <ProfileAccountSection
        currentUser={currentUser}
        onDeleteAccount={onDeleteAccount}
        onSendFeedback={onSendFeedback}
        t={t}
      />

      <CompletedPuzzleModal
        key={selectedCompletedPuzzle?.id || 'closed'}
        puzzle={selectedCompletedPuzzle}
        onClose={() => setSelectedCompletedPuzzle(null)}
        onDelete={onDeleteCompletedPuzzle}
        t={t}
      />

      {selectedPuzzleDetail && (
        <PuzzleDetailModal
          key={selectedPuzzleDetail.id}
          puzzle={selectedPuzzleDetail}
          currentUser={currentUser}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onClose={() => setSelectedPuzzleDetail(null)}
          onTrade={(puzzleToTrade) => setTradeModalPuzzle(puzzleToTrade)}
          onDelete={(id) => {
            onDeletePuzzle(id);
            setSelectedPuzzleDetail(null);
          }}
          t={t}
        />
      )}

      {editingPuzzle && (
        <EditPuzzleModal
          puzzle={editingPuzzle}
          onClose={() => setEditingPuzzle(null)}
          onSave={onUpdatePuzzle}
          t={t}
        />
      )}
    </div>
  );
}