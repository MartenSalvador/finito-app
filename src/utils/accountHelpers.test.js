import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteUserMock = vi.hoisted(() => vi.fn());
const reauthenticateMock = vi.hoisted(() => vi.fn());
const getDocsMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/auth', () => ({
  deleteUser: deleteUserMock,
  EmailAuthProvider: {
    credential: vi.fn((email, password) => ({ email, password })),
  },
  reauthenticateWithCredential: reauthenticateMock,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_, name) => ({ name })),
  deleteDoc: vi.fn(async () => {}),
  doc: vi.fn((_, name, id) => ({ path: `${name}/${id}` })),
  getDocs: getDocsMock,
  query: vi.fn((value) => value),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  writeBatch: vi.fn(() => ({ delete: vi.fn(), commit: vi.fn(async () => {}) })),
}));

vi.mock('firebase/storage', () => ({
  deleteObject: vi.fn(async () => {}),
  listAll: vi.fn(async () => ({ items: [], prefixes: [] })),
  ref: vi.fn((_, path) => ({ fullPath: path })),
}));

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'user-a',
      email: 'user-a@example.com',
      providerData: [{ providerId: 'password' }],
    },
  },
  db: {},
  storage: {},
}));

import { deleteAccountAndData } from './accountHelpers';

describe('account deletion', () => {
  beforeEach(() => {
    deleteUserMock.mockReset();
    deleteUserMock.mockResolvedValue();
    reauthenticateMock.mockReset();
    reauthenticateMock.mockResolvedValue();
    getDocsMock.mockReset();
    getDocsMock.mockResolvedValue({ docs: [] });
    window.localStorage.clear();
  });

  it('deletes the Firebase user and resets the local session', async () => {
    const setCurrentUser = vi.fn();
    const setIsLoggedIn = vi.fn();
    const setActiveTab = vi.fn();

    await deleteAccountAndData({
      userId: 'user-a',
      password: 'secret',
      setCurrentUser,
      setIsLoggedIn,
      setActiveTab,
      setPreviousTab: vi.fn(),
      setPuzzles: vi.fn(),
      setCompletedPuzzles: vi.fn(),
      setUserBadges: vi.fn(),
      setFavorites: vi.fn(),
      setTrades: vi.fn(),
      setProposals: vi.fn(),
      setUsers: vi.fn(),
      resetTradesSessionState: vi.fn(),
      setTradeModalPuzzle: vi.fn(),
      setViewedUserId: vi.fn(),
    });

    expect(deleteUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'user-a' })
    );
    expect(reauthenticateMock).toHaveBeenCalled();
    expect(setCurrentUser).toHaveBeenCalledWith(null);
    expect(setIsLoggedIn).toHaveBeenCalledWith(false);
    expect(setActiveTab).toHaveBeenCalledWith('explore');
  });

  it('does not remove account data if reauthentication fails', async () => {
    reauthenticateMock.mockRejectedValue(new Error('Invalid credentials'));

    await expect(deleteAccountAndData({ userId: 'user-a', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');

    expect(getDocsMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });
});
