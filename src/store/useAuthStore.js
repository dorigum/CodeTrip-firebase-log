import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { firebaseAuth, realtimeDb } from '../firebase';

const AUTH_EXPIRES_AT_KEY = 'trip_auth_expires_at';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

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

let unsubscribeAuth = null;
let sessionTimer = null;
let sessionCheckInterval = null;
let sessionVisibilityHandler = null;
let sessionFocusHandler = null;
let loginInProgress = false;

const setSessionExpiry = () => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
  return expiresAt;
};

const isSessionExpired = () => {
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY) || 0);
  return !expiresAt || Date.now() >= expiresAt;
};

const stopSessionMonitoring = () => {
  if (sessionTimer) {
    window.clearTimeout(sessionTimer);
    sessionTimer = null;
  }
  if (sessionCheckInterval) {
    window.clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  if (sessionVisibilityHandler) {
    document.removeEventListener('visibilitychange', sessionVisibilityHandler);
    sessionVisibilityHandler = null;
  }
  if (sessionFocusHandler) {
    window.removeEventListener('focus', sessionFocusHandler);
    sessionFocusHandler = null;
  }
};

const clearSession = () => {
  stopSessionMonitoring();
  localStorage.removeItem('trip_user');
  localStorage.removeItem('trip_token');
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
};

const expireSession = (set) => {
  if (!isSessionExpired()) return false;
  clearSession();
  firebaseAuth.signOut().catch(() => {});
  set({ user: null, isLoggedIn: false, isLoading: false });
  return true;
};

const startSessionMonitoring = (set) => {
  stopSessionMonitoring();

  const checkExpiry = () => expireSession(set);
  sessionCheckInterval = window.setInterval(checkExpiry, SESSION_CHECK_INTERVAL_MS);
  sessionVisibilityHandler = () => {
    if (document.visibilityState === 'visible') checkExpiry();
  };
  sessionFocusHandler = checkExpiry;

  document.addEventListener('visibilitychange', sessionVisibilityHandler);
  window.addEventListener('focus', sessionFocusHandler);
};

const scheduleSessionExpiry = (set, expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY) || 0)) => {
  startSessionMonitoring(set);
  const delay = Math.max(0, expiresAt - Date.now());
  sessionTimer = window.setTimeout(() => {
    expireSession(set);
  }, delay);
};

const storedUserCandidate = getStoredUser();
if (storedUserCandidate && isSessionExpired()) clearSession();

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
  user: null,
  isLoggedIn: false,
  isLoading: true,

  initAuthListener: () => {
    if (unsubscribeAuth) return unsubscribeAuth;

    const stopAuthListener = onAuthStateChanged(firebaseAuth, async (authUser) => {
      if (!authUser) {
        if (loginInProgress) {
          set({ user: null, isLoggedIn: false, isLoading: true });
          return;
        }
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

    unsubscribeAuth = () => {
      stopAuthListener();
      stopSessionMonitoring();
      unsubscribeAuth = null;
    };

    return unsubscribeAuth;
  },

  prepareLogin: () => {
    loginInProgress = true;
    setSessionExpiry();
    set({ user: null, isLoggedIn: false, isLoading: true });
  },

  cancelLogin: () => {
    loginInProgress = false;
    firebaseAuth.signOut().catch(() => {});
    clearSession();
    set({ user: null, isLoggedIn: false, isLoading: false });
  },

  login: (userData) => {
    loginInProgress = false;
    const user = persistUser(userData);
    if (user) scheduleSessionExpiry(set, setSessionExpiry());
    set({ user, isLoggedIn: !!user, isLoading: false });
  },

  logout: () => {
    loginInProgress = false;
    firebaseAuth.signOut().catch(() => {});
    clearSession();
    set({ user: null, isLoggedIn: false, isLoading: false });
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
