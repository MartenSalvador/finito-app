import { useState, useEffect } from 'react';
import { translations } from './translations';

import { INITIAL_USERS, INITIAL_DEMO_CREDENTIALS } from './data/mockUsers';
import { INITIAL_PUZZLES } from './data/mockPuzzles';
import { INITIAL_TRADES } from './data/mockTrades';
import { INITIAL_COMPLETED_PUZZLES } from './data/mockCompletedPuzzles';
import { BADGES_CATALOG, INITIAL_USER_BADGES } from './data/mockBadges';

import { useTradeLifecycle } from './hooks/useTradeLifecycle';
import { useAuthAndOnboarding } from './hooks/useAuthAndOnboarding';
import { useModeration } from './hooks/useModeration';
import { evaluateUserBadges } from './utils/badgeHelpers';
import { deleteAccountAndData } from './utils/accountHelpers';

import AuthView from './views/AuthView';
import MainViews from './components/MainViews';
import TradeModal from './components/TradeModal';
import Navbar from './components/Navbar';
import NavbarInferior from './components/NavbarInferior';
import WelcomeBanner from './components/WelcomeBanner';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const [lang, setLang] = useState('es');
  const t = translations[lang] || translations.es;

  const [users, setUsers] = useState(INITIAL_USERS);
  const [demoCredentialsByEmail, setDemoCredentialsByEmail] = useState(
    INITIAL_DEMO_CREDENTIALS
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [previousTab, setPreviousTab] = useState('explore');
  const [viewedUserId, setViewedUserId] = useState(null);

  const [puzzles, setPuzzles] = useState(INITIAL_PUZZLES);
  const [completedPuzzles, setCompletedPuzzles] = useState(INITIAL_COMPLETED_PUZZLES);
  const [userBadges, setUserBadges] = useState(INITIAL_USER_BADGES);
  const [favorites, setFavorites] = useState({});
  const [tradeModalPuzzle, setTradeModalPuzzle] = useState(null);
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [proposals, setProposals] = useState([]);

  const {
    blockedUserIds,
    reports,
    blockUser,
    unblockUser,
    reportUser,
  } = useModeration({
    currentUser,
    setTrades,
    setProposals,
    t,
  });

  const {
    selectedProposalId,
    pendingTradesCount,
    markProposalsRead,
    clearSelectedProposal,
    resetTradesSessionState,
    createTradeProposal,
    acceptTrade,
    rejectTrade,
    openChatFromTrade,
    completeTrade,
  } = useTradeLifecycle({
    currentUser,
    users,
    puzzles,
    setPuzzles,
    setFavorites,
    setActiveTab,
    trades,
    setTrades,
    proposals,
    setProposals,
    blockedUserIds,
    t,
  });

  // Keep earned badges permanently, even if a qualifying record is later removed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserBadges((prevBadges) => {
      let changed = false;
      const nextBadges = { ...prevBadges };
      const candidateIds = new Set([
        ...Object.keys(prevBadges || {}),
        ...users.map((user) => user.id),
        ...(currentUser?.id ? [currentUser.id] : []),
      ]);

      candidateIds.forEach((userId) => {
        const user =
          (currentUser?.id === userId ? currentUser : null) ||
          users.find((item) => item.id === userId) ||
          null;
        const currentList = Array.isArray(prevBadges?.[userId])
          ? prevBadges[userId]
          : [];
        const evaluatedList = evaluateUserBadges({
          user,
          userId,
          existingBadges: currentList,
          completedPuzzles,
          trades,
          proposals,
        });
        const sameItems =
          currentList.length === evaluatedList.length &&
          currentList.every((badgeId) => evaluatedList.includes(badgeId));

        if (!sameItems) {
          nextBadges[userId] = evaluatedList;
          changed = true;
        }
      });

      return changed ? nextBadges : prevBadges;
    });
  }, [completedPuzzles, trades, proposals, users, currentUser]);

  const handleNavigateTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'messages') {
      markProposalsRead();
    }
  };

  const {
    isLoggedIn,
    setIsLoggedIn,
    authModalMode,
    authPromptReason,
    showOnboarding,
    onboardingStep,
    setOnboardingStep,
    onboardingSteps,
    openAuthModal,
    closeAuthModal,
    finishOnboarding,
    handleAuthSuccess,
    handleLogout,
    handleRegisterUser,
    handleTabChange,
    handleRequestTrade,
    handleOpenUserProfile,
    toggleFavoriteWithAuth,
  } = useAuthAndOnboarding({
    currentUser,
    setCurrentUser,
    setUsers,
    setUserBadges,
    setDemoCredentialsByEmail,
    setFavorites,
    activeTab,
    setActiveTab,
    setPreviousTab,
    setViewedUserId,
    setTradeModalPuzzle,
    onNavigateTab: handleNavigateTab,
    onResetTradesSession: resetTradesSessionState,
    t,
  });

  const isAuthModalOpen = !isLoggedIn && Boolean(authModalMode);

  useEffect(() => {
    if (!isAuthModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAuthModal?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  const activeTradePuzzle =
    isLoggedIn && tradeModalPuzzle
      ? puzzles.find((puzzle) => puzzle.id === tradeModalPuzzle.id) || null
      : null;

  const handleUpdateProfile = (updatedData) => {
    const nextUser = { ...currentUser, ...updatedData };
    const locationChanged =
      nextUser.city !== currentUser.city ||
      nextUser.cp !== currentUser.cp ||
      nextUser.lat !== currentUser.lat ||
      nextUser.lon !== currentUser.lon;

    setCurrentUser(nextUser);
    setUsers((prev) => prev.map((u) => (u.id === nextUser.id ? nextUser : u)));

    if (!locationChanged) return;

    const hasValidLat = Number.isFinite(Number(nextUser.lat));
    const hasValidLon = Number.isFinite(Number(nextUser.lon));

    setPuzzles((prevPuzzles) =>
      prevPuzzles.map((puzzle) =>
        puzzle.userId !== nextUser.id
          ? puzzle
          : {
              ...puzzle,
              city: nextUser.city,
              cp: nextUser.cp ?? puzzle.cp,
              lat: hasValidLat ? Number(nextUser.lat) : puzzle.lat,
              lon: hasValidLon ? Number(nextUser.lon) : puzzle.lon,
              distanceKm: 0,
            }
      )
    );
  };

  const toggleFavorite = (puzzleId) => {
    toggleFavoriteWithAuth(puzzleId, (id) => {
      if (!currentUser?.id) return;
      setFavorites((prev) => {
        const currentFavs = Array.isArray(prev?.[currentUser.id])
          ? prev[currentUser.id]
          : [];
        const nextFavs = currentFavs.includes(id)
          ? currentFavs.filter((favId) => favId !== id)
          : [...currentFavs, id];

        return {
          ...prev,
          [currentUser.id]: nextFavs,
        };
      });
    });
  };

  const addPuzzle = (newPuzzle) => {
    setPuzzles((prev) => [newPuzzle, ...prev]);
    setActiveTab('explore');
  };

  const handleDeletePuzzle = (puzzleId) => {
    setPuzzles((prev) => prev.filter((p) => p.id !== puzzleId));
    setFavorites((prev) => {
      if (Array.isArray(prev)) {
        return prev.filter((id) => id !== puzzleId);
      }
      const next = {};
      Object.entries(prev || {}).forEach(([userId, favIds]) => {
        next[userId] = Array.isArray(favIds)
          ? favIds.filter((id) => id !== puzzleId)
          : [];
      });
      return next;
    });
  };

  const handleUpdatePuzzle = (updatedPuzzle) => {
    setPuzzles((prev) => prev.map((p) => (p.id === updatedPuzzle.id ? updatedPuzzle : p)));
  };

  const handleAddCompletedPuzzle = (newItem) => {
    const normalizedItem = {
      ...newItem,
      userId: newItem?.userId || newItem?.ownerId || currentUser?.id || null,
    };
    setCompletedPuzzles((prev) => [normalizedItem, ...prev]);
  };

  const handleDeleteCompletedPuzzle = (completedId) => {
    setCompletedPuzzles((prev) => prev.filter((item) => item.id !== completedId));
  };

  const handleCreateTradeProposal = (newProp) => {
    const targetPuzzle = activeTradePuzzle || tradeModalPuzzle;
    setTradeModalPuzzle(null);
    createTradeProposal(newProp, targetPuzzle);
  };

  const handleDeleteAccount = () => {
    if (!currentUser?.id) return;

    const email = currentUser.email?.trim().toLowerCase();
    if (email) {
      setDemoCredentialsByEmail((prev) => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
    }

    deleteAccountAndData({
      userId: currentUser.id,
      setUsers,
      setPuzzles,
      setCompletedPuzzles,
      setUserBadges,
      setFavorites,
      setTrades,
      setProposals,
      resetTradesSessionState,
      setTradeModalPuzzle,
      setViewedUserId,
      setCurrentUser,
      setIsLoggedIn,
      setActiveTab,
      setPreviousTab,
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#18181B] flex flex-col font-sans pb-20 transition-colors duration-300">
      <Navbar
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={openAuthModal}
        setActiveTab={handleTabChange}
        lang={lang}
        setLang={setLang}
        tradesCount={pendingTradesCount}
        activeTab={activeTab}
        t={t}
      />

      {!isLoggedIn && activeTab === 'explore' && (
        <WelcomeBanner onOpenAuthModal={openAuthModal} t={t} />
      )}

      <MainViews
        activeTab={activeTab}
        previousTab={previousTab}
        viewedUserId={viewedUserId}
        currentUser={currentUser}
        users={users}
        puzzles={puzzles}
        trades={trades}
        completedPuzzles={completedPuzzles}
        badgesCatalog={BADGES_CATALOG}
        userBadges={userBadges}
        favorites={favorites}
        proposals={proposals}
        setProposals={setProposals}
        selectedProposalId={selectedProposalId}
        onClearSelectedProposal={clearSelectedProposal}
        setTradeModalPuzzle={handleRequestTrade}
        setIsLoggedIn={setIsLoggedIn}
        onLogout={handleLogout}
        onTabChange={handleTabChange}
        onOpenUserProfile={handleOpenUserProfile}
        onUpdateProfile={handleUpdateProfile}
        onToggleFavorite={toggleFavorite}
        onAddPuzzle={addPuzzle}
        onDeletePuzzle={handleDeletePuzzle}
        onUpdatePuzzle={handleUpdatePuzzle}
        onAddCompletedPuzzle={handleAddCompletedPuzzle}
        onDeleteCompletedPuzzle={handleDeleteCompletedPuzzle}
        onAcceptTrade={acceptTrade}
        onRejectTrade={rejectTrade}
        onConfirmTrade={completeTrade}
        onOpenChat={openChatFromTrade}
        t={t}
        blockedUserIds={blockedUserIds}
        reports={reports}
        onBlockUser={blockUser}
        onUnblockUser={unblockUser}
        onReportUser={reportUser}
        onDeleteAccount={handleDeleteAccount}
      />

      {activeTradePuzzle && (
        <TradeModal
          puzzle={activeTradePuzzle}
          currentUser={currentUser}
          puzzles={puzzles}
          trades={trades}
          onClose={() => setTradeModalPuzzle(null)}
          onPropose={handleCreateTradeProposal}
          t={t}
        />
      )}

      <NavbarInferior
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        proposals={proposals}
        isLoggedIn={isLoggedIn}
        t={t}
      />

      {isAuthModalOpen && (
        <div
          onClick={closeAuthModal}
          className="fixed inset-0 z-50 bg-[#18181B]/45 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl animate-modal-pop"
          >
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label={t?.closeModal || 'Cerrar'}
              className="absolute top-4 right-4 z-10 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border border-[#E5E0F5] transition-all duration-200 active:scale-90"
            >
              ✕
            </button>

            <AuthView
              key={authModalMode}
              asModal
              initialMode={authModalMode}
              promptReason={authPromptReason}
              users={users}
              credentialsByEmail={demoCredentialsByEmail}
              onRegisterUser={handleRegisterUser}
              setCurrentUser={setCurrentUser}
              setIsLoggedIn={setIsLoggedIn}
              onAuthSuccess={handleAuthSuccess}
              lang={lang}
              setLang={setLang}
              t={t}
            />
          </div>
        </div>
      )}

      {isLoggedIn && showOnboarding && (
        <OnboardingModal
          currentUser={currentUser}
          steps={onboardingSteps}
          currentStep={onboardingStep}
          onSelectStep={setOnboardingStep}
          onPrevStep={() => setOnboardingStep((prev) => Math.max(0, prev - 1))}
          onNextStep={() =>
            setOnboardingStep((prev) => Math.min(onboardingSteps.length - 1, prev + 1))
          }
          onFinish={finishOnboarding}
          t={t}
        />
      )}
    </div>
  );
}