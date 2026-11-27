import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

const BLOCKS_STORAGE_KEY = 'finito_blocked_users_v1';
const REPORTS_STORAGE_KEY = 'finito_user_reports_v1';

function removeUserFromStorageMap(storageKey, userId) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && userId in parsed) {
      delete parsed[userId];
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    }
  } catch {
    // Ignorar errores de storage
  }
}

async function deleteQueryDocs(queries) {
  const docRefsMap = new Map();

  for (const q of queries) {
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      docRefsMap.set(d.ref.path, d.ref);
    });
  }

  const refs = Array.from(docRefsMap.values());
  const chunkSize = 450;

  for (let i = 0; i < refs.length; i += chunkSize) {
    const batch = writeBatch(db);
    refs.slice(i, i + chunkSize).forEach((refItem) => batch.delete(refItem));
    await batch.commit();
  }
}

async function deleteStorageFolder(folderPath) {
  try {
    const folderRef = ref(storage, folderPath);
    const listing = await listAll(folderRef);

    await Promise.all([
      ...listing.items.map((itemRef) =>
        deleteObject(itemRef).catch((err) => {
          if (err?.code !== 'storage/object-not-found') throw err;
        })
      ),
      ...listing.prefixes.map((subFolderRef) =>
        deleteStorageFolder(subFolderRef.fullPath)
      ),
    ]);
  } catch (err) {
    if (err?.code !== 'storage/object-not-found') throw err;
  }
}

async function cleanupRemoteAccountData(userId) {
  const targetId = String(userId);

  await deleteQueryDocs([
    query(collection(db, 'puzzles'), where('userId', '==', targetId)),
    query(collection(db, 'completedPuzzles'), where('userId', '==', targetId)),
    query(collection(db, 'trades'), where('senderId', '==', targetId)),
    query(collection(db, 'trades'), where('receiverId', '==', targetId)),
    query(collection(db, 'proposals'), where('senderId', '==', targetId)),
    query(collection(db, 'proposals'), where('receiverId', '==', targetId)),
    query(collection(db, 'reports'), where('reporterId', '==', targetId)),
  ]);

  await Promise.all([
    deleteStorageFolder(`puzzles/${targetId}`),
    deleteStorageFolder(`completedPuzzles/${targetId}`),
    deleteStorageFolder(`users/${targetId}`),
  ]);

  await deleteDoc(doc(db, 'users', targetId));
  await deleteDoc(doc(db, 'publicProfiles', targetId));
  await deleteUser(auth.currentUser);
}

export async function deleteAccountAndData({
  userId,
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
  password,
}) {
  if (!userId) return;
  const targetId = String(userId);
  if (!auth.currentUser || auth.currentUser.uid !== targetId) {
    throw new Error('Solo podés eliminar la cuenta autenticada.');
  }
  if (!password) {
    throw new Error('Ingresá tu contraseña para confirmar la eliminación.');
  }

  const passwordProvider = auth.currentUser.providerData.some(
    (provider) => provider.providerId === 'password'
  );
  if (!passwordProvider || !auth.currentUser.email) {
    throw new Error('Esta cuenta no puede reautenticarse con contraseña.');
  }

  await reauthenticateWithCredential(
    auth.currentUser,
    EmailAuthProvider.credential(auth.currentUser.email, password)
  );

  await cleanupRemoteAccountData(targetId);

  removeUserFromStorageMap(BLOCKS_STORAGE_KEY, userId);
  removeUserFromStorageMap(BLOCKS_STORAGE_KEY, targetId);
  removeUserFromStorageMap(REPORTS_STORAGE_KEY, userId);
  removeUserFromStorageMap(REPORTS_STORAGE_KEY, targetId);

  setPuzzles?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (p) => String(p?.userId ?? p?.ownerId ?? '') !== targetId
        )
      : []
  );

  setCompletedPuzzles?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (item) => String(item?.userId ?? item?.ownerId ?? '') !== targetId
        )
      : []
  );

  setUserBadges?.((prev) => {
    if (!prev || typeof prev !== 'object') return {};
    const next = { ...prev };
    delete next[userId];
    delete next[targetId];
    return next;
  });

  setFavorites?.((prev) => {
    if (!prev || typeof prev !== 'object') return {};
    const next = { ...prev };
    delete next[userId];
    delete next[targetId];
    return next;
  });

  setTrades?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (tr) =>
            String(tr?.senderId ?? tr?.sender?.id ?? '') !== targetId &&
            String(tr?.receiverId ?? tr?.receiver?.id ?? tr?.targetUserId ?? '') !==
              targetId
        )
      : []
  );

  setProposals?.((prev) =>
    Array.isArray(prev)
      ? prev.filter(
          (prop) =>
            String(prop?.senderId ?? '') !== targetId &&
            String(
              prop?.receiverId ?? prop?.recipientId ?? prop?.targetOwnerId ?? ''
            ) !== targetId
        )
      : []
  );

  setUsers?.((prev) =>
    Array.isArray(prev)
      ? prev.filter((u) => String(u?.id) !== targetId)
      : []
  );

  resetTradesSessionState?.();
  setTradeModalPuzzle?.(null);
  setViewedUserId?.(null);
  setCurrentUser?.(null);
  setIsLoggedIn?.(false);
  setActiveTab?.('explore');
  setPreviousTab?.('explore');
}