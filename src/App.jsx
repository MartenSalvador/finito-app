import { lazy, Suspense, useState, useEffect } from 'react';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase/config';
import { translations } from './translations';

import { INITIAL_USERS } from './data/mockUsers';
import { INITIAL_PUZZLES } from './data/mockPuzzles';
import { INITIAL_TRADES } from './data/mockTrades';
import { INITIAL_COMPLETED_PUZZLES } from './data/mockCompletedPuzzles';
import { BADGES_CATALOG, INITIAL_USER_BADGES } from './data/mockBadges';

import { useTradeLifecycle } from './hooks/useTradeLifecycle';
import { useAuthAndOnboarding } from './hooks/useAuthAndOnboarding';
import { useModeration } from './hooks/useModeration';
import { evaluateUserBadges } from './utils/badgeHelpers';
import { deleteAccountAndData } from './utils/accountHelpers';
import { toPublicProfile } from './utils/profileHelpers';

import Navbar from './components/Navbar';
import NavbarInferior from './components/NavbarInferior';
import WelcomeBanner from './components/WelcomeBanner';

const AuthView = lazy(() => import('./views/AuthView'));
const MainViews = lazy(() => import('./components/MainViews'));
const TradeModal = lazy(() => import('./components/TradeModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));

export default function App() {
  const [lang, setLang] = useState('es');
  const t = translations[lang] || translations.es;

  const [users, setUsers] = useState(INITIAL_USERS);
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
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigateTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'messages') {
      markProposalsRead();
    }
  };

  // Suscripción en tiempo real a rompecabezas en Firestore (público en Explorar)
  useEffect(() => {
    const puzzlesQuery = query(
      collection(db, 'puzzles'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      puzzlesQuery,
      (snapshot) => {
        const firestorePuzzles = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setPuzzles(() => {
          const seenIds = new Set(firestorePuzzles.map((p) => p.id));
          const remainingInitial = INITIAL_PUZZLES.filter((p) => !seenIds.has(p.id));
          return [...firestorePuzzles, ...remainingInitial];
        });
      },
      (error) => {
        console.error('Error escuchando colección puzzles:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Hidrata favoritos desde el perfil de Firestore del usuario autenticado
  useEffect(() => {
    if (!currentUser?.id) return;
    if (!Array.isArray(currentUser.favorites)) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites((prev) => ({
      ...prev,
      [currentUser.id]: currentUser.favorites,
    }));
  }, [currentUser?.id, currentUser?.favorites]);

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

  const canListenPrivateCollections =
    authReady && Boolean(auth.currentUser) && (isLoggedIn || Boolean(currentUser?.id));

  // Public profile documents never contain account credentials or moderation state.
  useEffect(() => {
    if (!canListenPrivateCollections) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers(INITIAL_USERS);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'publicProfiles'),
      (snapshot) => {
        const firestoreUsers = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setUsers(() => {
          const mergedMap = new Map();
          INITIAL_USERS.forEach((u) => mergedMap.set(u.id, u));
          firestoreUsers.forEach((u) => mergedMap.set(u.id, u));
          return Array.from(mergedMap.values());
        });

      },
      (error) => {
        console.error('Error escuchando perfiles públicos:', error);
      }
    );

    return () => unsubscribe();
  }, [canListenPrivateCollections]);

  useEffect(() => {
    if (!canListenPrivateCollections || !currentUser?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.id),
      (snapshot) => {
        if (!snapshot.exists()) return;
        setCurrentUser((prev) =>
          prev?.id === snapshot.id
            ? { ...prev, ...snapshot.data() }
            : prev
        );
      },
      (error) => {
        console.error('Error escuchando el perfil privado:', error);
      }
    );

    return () => unsubscribe();
  }, [canListenPrivateCollections, currentUser?.id]);

  // Suscripción en tiempo real a armados completados en Firestore (solo con sesión activa)
  useEffect(() => {
    if (!canListenPrivateCollections) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletedPuzzles(INITIAL_COMPLETED_PUZZLES);
      return;
    }

    const completedQuery = query(
      collection(db, 'completedPuzzles'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      completedQuery,
      (snapshot) => {
        const firestoreCompleted = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setCompletedPuzzles(() => {
          const seenIds = new Set(firestoreCompleted.map((item) => item.id));
          const remainingInitial = INITIAL_COMPLETED_PUZZLES.filter(
            (item) => !seenIds.has(item.id)
          );
          return [...firestoreCompleted, ...remainingInitial];
        });
      },
      (error) => {
        console.error('Error escuchando colección completedPuzzles:', error);
      }
    );

    return () => unsubscribe();
  }, [canListenPrivateCollections]);

  // Suscripción en tiempo real a intercambios en Firestore (solo con sesión activa)
  useEffect(() => {
    if (!canListenPrivateCollections) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrades(INITIAL_TRADES);
      return;
    }

    const tradesQuery = query(
      collection(db, 'trades'),
      or(
        where('senderId', '==', auth.currentUser.uid),
        where('receiverId', '==', auth.currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(
      tradesQuery,
      (snapshot) => {
        const firestoreTrades = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setTrades(() => {
          const seenIds = new Set(firestoreTrades.map((tr) => tr.id));
          const remainingInitial = INITIAL_TRADES.filter((tr) => !seenIds.has(tr.id));
          return [
            ...firestoreTrades.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
            ...remainingInitial,
          ];
        });
      },
      (error) => {
        console.error('Error escuchando colección trades:', error);
      }
    );

    return () => unsubscribe();
  }, [canListenPrivateCollections]);

  // Suscripción en tiempo real a propuestas / chats aceptados en Firestore (solo con sesión activa)
  useEffect(() => {
    if (!canListenPrivateCollections) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProposals([]);
      return;
    }

    const proposalsQuery = query(
      collection(db, 'proposals'),
      or(
        where('senderId', '==', auth.currentUser.uid),
        where('receiverId', '==', auth.currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(
      proposalsQuery,
      (snapshot) => {
        const firestoreProposals = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setProposals(
          firestoreProposals.sort(
            (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
          )
        );
      },
      (error) => {
        console.error('Error escuchando colección proposals:', error);
      }
    );

    return () => unsubscribe();
  }, [canListenPrivateCollections]);

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

  const handleUpdateProfile = async (updatedData) => {
    if (!currentUser?.id) return;

    const nextUser = { ...currentUser, ...updatedData };
    const locationChanged =
      nextUser.city !== currentUser.city ||
      nextUser.cp !== currentUser.cp ||
      nextUser.lat !== currentUser.lat ||
      nextUser.lon !== currentUser.lon;

    setCurrentUser(nextUser);
    setUsers((prev) =>
      prev.map((user) =>
        user.id === nextUser.id
          ? { ...user, id: nextUser.id, ...toPublicProfile(nextUser) }
          : user
      )
    );

    try {
      await updateDoc(doc(db, 'users', nextUser.id), updatedData);
      await setDoc(
        doc(db, 'publicProfiles', nextUser.id),
        toPublicProfile(nextUser),
        { merge: true }
      );
    } catch (error) {
      console.error('Error actualizando perfil en Firestore:', error);
    }

    if (!locationChanged) return;

    const hasValidLat = Number.isFinite(Number(nextUser.lat));
    const hasValidLon = Number.isFinite(Number(nextUser.lon));

    const ownedPuzzles = puzzles.filter((p) => p.userId === nextUser.id);

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

    // Sincroniza ubicación en los rompecabezas propios guardados en Firestore
    await Promise.all(
      ownedPuzzles.map(async (puzzle) => {
        if (String(puzzle.id).startsWith('p')) return; // ignora mocks estáticos
        try {
          await updateDoc(doc(db, 'puzzles', puzzle.id), {
            city: nextUser.city,
            cp: nextUser.cp ?? puzzle.cp ?? '',
            ...(hasValidLat ? { lat: Number(nextUser.lat) } : {}),
            ...(hasValidLon ? { lon: Number(nextUser.lon) } : {}),
            distanceKm: 0,
          });
        } catch (error) {
          console.error('Error actualizando ubicación de puzzle en Firestore:', error);
        }
      })
    );
  };

  const toggleFavorite = (puzzleId) => {
    toggleFavoriteWithAuth(puzzleId, async (id) => {
      if (!currentUser?.id) return;

      const currentFavs = Array.isArray(favorites?.[currentUser.id])
        ? favorites[currentUser.id]
        : [];
      const isAlreadyFav = currentFavs.includes(id);
      const nextFavs = isAlreadyFav
        ? currentFavs.filter((favId) => favId !== id)
        : [...currentFavs, id];

      setFavorites((prev) => ({
        ...prev,
        [currentUser.id]: nextFavs,
      }));

      try {
        await updateDoc(doc(db, 'users', currentUser.id), {
          favorites: isAlreadyFav ? arrayRemove(id) : arrayUnion(id),
        });
      } catch (error) {
        console.error('Error guardando favorito en Firestore:', error);
      }
    });
  };

  const addPuzzle = (newPuzzle) => {
    setPuzzles((prev) => {
      if (prev.some((p) => p.id === newPuzzle.id)) return prev;
      return [newPuzzle, ...prev];
    });
    setActiveTab('explore');
  };

  const handleDeletePuzzle = async (puzzleId) => {
    const previousPuzzles = puzzles;
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

    if (!puzzleId || String(puzzleId).startsWith('p')) return;

    try {
      await deleteDoc(doc(db, 'puzzles', puzzleId));
    } catch (error) {
      console.error('Error eliminando rompecabezas en Firestore:', error);
      setPuzzles(previousPuzzles);
    }
  };

  const handleUpdatePuzzle = async (updatedPuzzle) => {
    setPuzzles((prev) =>
      prev.map((p) => (p.id === updatedPuzzle.id ? updatedPuzzle : p))
    );

    try {
      const { id, ...fieldsToUpdate } = updatedPuzzle;
      await updateDoc(doc(db, 'puzzles', id), fieldsToUpdate);
    } catch (error) {
      console.error('Error actualizando rompecabezas en Firestore:', error);
    }
  };

  const handleAddCompletedPuzzle = async (newItem) => {
    const ownerId = auth.currentUser?.uid || newItem?.userId || newItem?.ownerId || currentUser?.id || null;
    const payload = {
      userId: ownerId,
      title: newItem?.title?.trim() || '',
      pieces: Number(newItem?.pieces) || 1000,
      image: newItem?.image || newItem?.images?.[0] || '',
      completedAt: newItem?.completedAt || new Date().toISOString().slice(0, 7),
      note: newItem?.note?.trim() || '',
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'completedPuzzles'), payload);
      const normalizedItem = {
        id: docRef.id,
        ...payload,
        createdAt: new Date().toISOString(),
      };

      setCompletedPuzzles((prev) => {
        if (prev.some((item) => item.id === normalizedItem.id)) return prev;
        return [normalizedItem, ...prev];
      });

      return normalizedItem;
    } catch (error) {
      console.error('Error guardando armado en Firestore:', error);
      throw error;
    }
  };

  const handleDeleteCompletedPuzzle = async (completedId) => {
    setCompletedPuzzles((prev) => prev.filter((item) => item.id !== completedId));
    if (!completedId || String(completedId).startsWith('cp')) return;

    try {
      await deleteDoc(doc(db, 'completedPuzzles', completedId));
    } catch (error) {
      console.error('Error eliminando armado en Firestore:', error);
    }
  };

  const handleCreateTradeProposal = async (newProp) => {
    const targetPuzzle = activeTradePuzzle || tradeModalPuzzle;
    await createTradeProposal(newProp, targetPuzzle);
    setTradeModalPuzzle(null);
  };

  const handleDeleteAccount = async (password) => {
    if (!currentUser?.id) return;

    try {
      await deleteAccountAndData({
        userId: currentUser.id,
        password,
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
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      throw error;
    }
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

      <Suspense fallback={null}>
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
      </Suspense>

      {activeTradePuzzle && (
        <Suspense fallback={null}>
          <TradeModal
            puzzle={activeTradePuzzle}
            currentUser={currentUser}
            puzzles={puzzles}
            trades={trades}
            onClose={() => setTradeModalPuzzle(null)}
            onPropose={handleCreateTradeProposal}
            t={t}
          />
        </Suspense>
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

            <Suspense fallback={null}>
              <AuthView
                key={authModalMode}
                asModal
                initialMode={authModalMode}
                promptReason={authPromptReason}
                users={users}
                onRegisterUser={handleRegisterUser}
                setCurrentUser={setCurrentUser}
                setIsLoggedIn={setIsLoggedIn}
                onAuthSuccess={handleAuthSuccess}
                lang={lang}
                setLang={setLang}
                t={t}
              />
            </Suspense>
          </div>
        </div>
      )}

      {isLoggedIn && showOnboarding && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}