import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { firebaseAuth, realtimeDb } from '../firebase';

const AUTH_EXPIRES_AT_KEY = 'trip_auth_expires_at';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('trip_user');
    if (!rawUser || rawUser === 'undefined') return null;
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem('trip_user');
    return null;
  }
};

const persistUser = (userData) => {
  if (!userData) {
    localStorage.removeItem('trip_user');
    return null;
  }

  localStorage.setItem('trip_user', JSON.stringify(userData));
  return userData;
};

const storedUser = getStoredUser();
let unsubscribeAuth = null;
let sessionTimer = null;

const setSessionExpiry = () => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
  return expiresAt;
};

const clearSession = () => {
  if (sessionTimer) {
    window.clearTimeout(sessionTimer);
    sessionTimer = null;
  }
  localStorage.removeItem('trip_user');
  localStorage.removeItem('trip_token');
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
};

const isSessionExpired = () => {
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY) || 0);
  return !expiresAt || Date.now() > expiresAt;
};

const scheduleSessionExpiry = (set, expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY) || 0)) => {
  if (sessionTimer) window.clearTimeout(sessionTimer);
  const delay = Math.max(0, expiresAt - Date.now());
  sessionTimer = window.setTimeout(() => {
    clearSession();
    firebaseAuth.signOut().catch(() => {});
    set({ user: null, isLoggedIn: false, isLoading: false });
  }, delay);
};

const buildAuthUser = async (authUser) => {
  const profileSnap = await get(ref(realtimeDb, `users/${authUser.uid}`));
  const profile = profileSnap.exists() ? profileSnap.val() : {};
  return {
    id: authUser.uid,
    email: authUser.email || profile.email,
    name: profile.name || authUser.displayName || authUser.email,
    profileImg: profile.profileImg || authUser.photoURL || '',
  };
};

const useAuthStore = create((set) => ({
  user: storedUser,
  isLoggedIn: !!storedUser,
  isLoading: true,

  initAuthListener: () => {
    if (unsubscribeAuth) return unsubscribeAuth;

    unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (authUser) => {
      if (!authUser) {
        clearSession();
        set({ user: null, isLoggedIn: false, isLoading: false });
        return;
      }

      if (isSessionExpired()) {
        clearSession();
        await firebaseAuth.signOut().catch(() => {});
        set({ user: null, isLoggedIn: false, isLoading: false });
        return;
      }

      try {
        const user = persistUser(await buildAuthUser(authUser));
        scheduleSessionExpiry(set);
        set({ user, isLoggedIn: true, isLoading: false });
      } catch {
        const fallbackUser = persistUser({
          id: authUser.uid,
          email: authUser.email,
          name: authUser.displayName || authUser.email,
          profileImg: authUser.photoURL || '',
        });
        scheduleSessionExpiry(set);
        set({ user: fallbackUser, isLoggedIn: true, isLoading: false });
      }
    });

    return unsubscribeAuth;
  },

  login: (userData) => {
    const user = persistUser(userData);
    if (user) scheduleSessionExpiry(set, setSessionExpiry());
    set({ user, isLoggedIn: !!user });
  },

  logout: () => {
    firebaseAuth.signOut().catch(() => {});
    clearSession();
    set({ user: null, isLoggedIn: false });
  },

  setUser: (userData) => {
    const user = persistUser(userData);
    if (user) scheduleSessionExpiry(set, setSessionExpiry());
    set({ user, isLoggedIn: !!user });
  },

  // 프로필 정보 업데이트 (기존 유저 정보와 병합)
  updateUser: (updatedData) => {
    set((state) => {
      const newUser = { ...state.user, ...updatedData };
      persistUser(newUser);
      return { user: newUser };
    });
  }
}));

export default useAuthStore;
