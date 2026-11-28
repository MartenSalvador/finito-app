import { useEffect, useCallback, useMemo } from 'react';
import ExploreView from '../views/ExploreView';
import PublishView from '../views/PublishView';
import FavoritesView from '../views/FavoritesView';
import MessagesView from '../views/MessagesView';
import ProfileView from './profile/ProfileView';
import UserProfileView from '../views/UserProfileView';
import TradeRequestsView from '../views/TradeRequestsView';

export default function MainViews({
  activeTab,
  previousTab,
  viewedUserId,
  currentUser,
  users,
  puzzles,
  trades,
  completedPuzzles,
  badgesCatalog,
  userBadges,
  favorites,
  proposals,
  setProposals,
  inboxNavigationVersion,
  blockedUserIds = [],
  onBlockUser,
  onUnblockUser,
  onReportUser,
  selectedProposalId,
  onClearSelectedProposal,
  setTradeModalPuzzle,
  setIsLoggedIn,
  onLogout,
  onDeleteAccount,
  onTabChange,
  onOpenUserProfile,
  onUpdateProfile,
  onToggleFavorite,
  onAddPuzzle,
  onDeletePuzzle,
  onUpdatePuzzle,
  onAddCompletedPuzzle,
  onDeleteCompletedPuzzle,
  onAcceptTrade,
  onRejectTrade,
  onOpenChat,
  onConfirmTrade,
  lang,
  t,
}) {
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [activeTab]);

  const blockedSet = useMemo(
    () =>
      new Set(
        (Array.isArray(blockedUserIds) ? blockedUserIds : []).map((id) =>
          String(id)
        )
      ),
    [blockedUserIds]
  );

  const visiblePuzzles = useMemo(() => {
    if (!Array.isArray(puzzles)) return [];
    if (blockedSet.size === 0) return puzzles;
    return puzzles.filter(
      (p) => p?.userId == null || !blockedSet.has(String(p.userId))
    );
  }, [puzzles, blockedSet]);

  const handleBackFromUserProfile = useCallback(() => {
    onTabChange?.(previousTab || 'explore');
  }, [onTabChange, previousTab]);

  const handleTradeFromUserProfile = useCallback(
    (puzzleToTrade) => {
      setTradeModalPuzzle?.(puzzleToTrade);
    },
    [setTradeModalPuzzle]
  );

  const viewTransitionKey =
    activeTab === 'userProfile' ? `${activeTab}-${viewedUserId || ''}` : activeTab;

  return (
    <main
      id="main-content"
      className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 bg-[#FFFFFF] text-[#18181B] transition-colors duration-300"
    >
      <div key={viewTransitionKey} className="animate-fade-in">
        {activeTab === 'explore' && (
          <ExploreView
            puzzles={visiblePuzzles}
            favorites={favorites}
            currentUser={currentUser}
            toggleFavorite={onToggleFavorite}
            setTradeModalPuzzle={setTradeModalPuzzle}
            onOpenUserProfile={onOpenUserProfile}
            t={t}
          />
        )}

        {activeTab === 'publish' && (
          <PublishView
            currentUser={currentUser}
            addPuzzle={onAddPuzzle}
            t={t}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            puzzles={visiblePuzzles}
            favorites={favorites}
            currentUser={currentUser}
            toggleFavorite={onToggleFavorite}
            setTradeModalPuzzle={setTradeModalPuzzle}
            setActiveTab={onTabChange}
            onOpenUserProfile={onOpenUserProfile}
            t={t}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesView
            key={inboxNavigationVersion}
            proposals={proposals}
            setProposals={setProposals}
            currentUser={currentUser}
            users={users}
            blockedUserIds={blockedUserIds}
            onBlockUser={onBlockUser}
            onUnblockUser={onUnblockUser}
            onReportUser={onReportUser}
            selectedProposalId={selectedProposalId}
            onClearSelectedProposal={onClearSelectedProposal}
            onConfirmTrade={onConfirmTrade}
            onOpenUserProfile={onOpenUserProfile}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            puzzles={puzzles}
            completedPuzzles={completedPuzzles}
            badgesCatalog={badgesCatalog}
            userBadges={userBadges}
            onAddCompletedPuzzle={onAddCompletedPuzzle}
            onDeleteCompletedPuzzle={onDeleteCompletedPuzzle}
            setIsLoggedIn={setIsLoggedIn}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
            onDeletePuzzle={onDeletePuzzle}
            onUpdatePuzzle={onUpdatePuzzle}
            onUpdateProfile={onUpdateProfile}
            favorites={favorites}
            toggleFavorite={onToggleFavorite}
            setTradeModalPuzzle={setTradeModalPuzzle}
            setActiveTab={onTabChange}
            t={t}
          />
        )}

        {activeTab === 'userProfile' && (
          <UserProfileView
            userId={viewedUserId}
            users={users}
            puzzles={puzzles}
            completedPuzzles={completedPuzzles}
            badgesCatalog={badgesCatalog}
            userBadges={userBadges}
            currentUser={currentUser}
            onBack={handleBackFromUserProfile}
            onOpenUserProfile={onOpenUserProfile}
            onTrade={handleTradeFromUserProfile}
            t={t}
          />
        )}

        {activeTab === 'trades' && (
          <TradeRequestsView
            incomingTrades={trades}
            trades={trades}
            puzzles={puzzles}
            users={users}
            currentUser={currentUser}
            favorites={favorites}
            toggleFavorite={onToggleFavorite}
            onAcceptTrade={onAcceptTrade}
            onRejectTrade={onRejectTrade}
            onOpenChat={onOpenChat}
            onOpenUserProfile={onOpenUserProfile}
            t={t}
          />
        )}
      </div>
    </main>
  );
}