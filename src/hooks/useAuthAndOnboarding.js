import { useState, useCallback } from 'react';

const PROTECTED_TABS = new Set(['publish', 'favorites', 'messages', 'profile', 'trades']);

export function useAuthAndOnboarding({
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
  onNavigateTab,
  onResetTradesSession,
  t,
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalMode, setAuthModalMode] = useState(null); // null | 'login' | 'register'
  const [authPromptReason, setAuthPromptReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onboardingSteps = [
    {
      emoji: '🧩',
      title: t?.tutorialStep1Title || 'Explorá rompecabezas cerca tuyo',
      desc:
        t?.tutorialStep1Desc ||
        'Filtrá por ciudad o cercanía, mirá el estado de cada puzzle y proponé intercambios por los que ya armaste.',
    },
    {
      emoji: '📸',
      title: t?.tutorialStep2Title || 'Publicá y compartí tus armados',
      desc:
        t?.tutorialStep2Desc ||
        'Subí los rompecabezas que querés intercambiar y sumá a tu galería los que ya terminaste.',
    },
    {
      emoji: '💬',
      title: t?.tutorialStep3Title || 'Conectá y coordiná el cambio',
      desc:
        t?.tutorialStep3Desc ||
        'Cuando una propuesta se acepta, se abre el chat para coordinar el intercambio fácilmente.',
    },
  ];

  const openAuthModal = useCallback((mode = 'login', reason = '', action = null) => {
    setAuthModalMode(mode);
    setAuthPromptReason(reason);
    setPendingAction(() => action);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalMode(null);
    setAuthPromptReason('');
    setPendingAction(null);
  }, []);

  const requireAuth = useCallback(
    (reason, action) => {
      if (isLoggedIn && currentUser) {
        action?.();
        return;
      }
      openAuthModal('login', reason, action);
    },
    [isLoggedIn, currentUser, openAuthModal]
  );

  const finishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    const actionToRun = pendingAction;
    setPendingAction(null);
    if (typeof actionToRun === 'function') {
      actionToRun();
    }
  }, [pendingAction]);

  const handleAuthSuccess = useCallback(
    (loggedUser, meta = {}) => {
      const nextUser = loggedUser || currentUser;
      if (nextUser) {
        setCurrentUser(nextUser);
        setIsLoggedIn(true);
      }

      setAuthModalMode(null);
      setAuthPromptReason('');

      if (meta?.isNewRegistration) {
        setOnboardingStep(0);
        setShowOnboarding(true);
        return;
      }

      const actionToRun = pendingAction;
      setPendingAction(null);
      if (typeof actionToRun === 'function') {
        actionToRun();
      }
    },
    [currentUser, setCurrentUser, pendingAction]
  );

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowOnboarding(false);
    setOnboardingStep(0);
    setPendingAction(null);
    setTradeModalPuzzle?.(null);
    onResetTradesSession?.();
    setActiveTab('explore');
  }, [setCurrentUser, setTradeModalPuzzle, onResetTradesSession, setActiveTab]);

  const handleRegisterUser = useCallback(
    (newUser, password) => {
      setUsers((prev) => [...prev, newUser]);
      setDemoCredentialsByEmail((prev) => ({
        ...prev,
        [newUser.email.trim().toLowerCase()]: password,
      }));
      setUserBadges((prev) => ({
        ...prev,
        [newUser.id]: [],
      }));
      setFavorites((prev) => ({
        ...prev,
        [newUser.id]: [],
      }));
    },
    [setUsers, setDemoCredentialsByEmail, setUserBadges, setFavorites]
  );

  const handleTabChange = useCallback(
    (tabId) => {
      if (PROTECTED_TABS.has(tabId)) {
        requireAuth(
          t?.authRequiredTab || 'Iniciá sesión o creá tu cuenta para acceder a esta sección.',
          () => onNavigateTab(tabId)
        );
        return;
      }
      onNavigateTab(tabId);
    },
    [requireAuth, onNavigateTab, t]
  );

  const handleRequestTrade = useCallback(
    (puzzleToTrade) => {
      requireAuth(
        t?.authRequiredTrade || 'Iniciá sesión o creá tu cuenta para proponer un intercambio.',
        () => setTradeModalPuzzle(puzzleToTrade)
      );
    },
    [requireAuth, setTradeModalPuzzle, t]
  );

  const handleOpenUserProfile = useCallback(
    (userId) => {
      if (!userId) return;
      requireAuth(
        t?.authRequiredProfile || 'Iniciá sesión o creá tu cuenta para ver perfiles de otros usuarios.',
        () => {
          if (activeTab !== 'userProfile') {
            setPreviousTab(activeTab);
          }
          setViewedUserId(userId);
          setActiveTab('userProfile');
        }
      );
    },
    [requireAuth, activeTab, setPreviousTab, setViewedUserId, setActiveTab, t]
  );

  const toggleFavoriteWithAuth = useCallback(
    (puzzleId, onAuthorizedToggle) => {
      requireAuth(
        t?.authRequiredFavorite || 'Iniciá sesión o creá tu cuenta para guardar favoritos.',
        () => onAuthorizedToggle(puzzleId)
      );
    },
    [requireAuth, t]
  );

  return {
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
  };
}