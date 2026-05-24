import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../firebase';

export const nowIso = () => new Date().toISOString();

export const toIso = (value) => {
  if (!value) return nowIso();
  if (typeof value === 'string') return value;
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('trip_user') || 'null');
  } catch {
    return null;
  }
};

const waitForAuthUser = () =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

export const getCurrentUser = async () => {
  const authUser = firebaseAuth.currentUser || await waitForAuthUser();
  const storedUser = getStoredUser();
  if (!authUser) {
    throw { message: '로그인이 필요합니다.' };
  }

  return {
    id: authUser.uid,
    email: authUser.email || storedUser?.email,
    name: authUser.displayName || storedUser?.name || '익명',
    profileImg: storedUser?.profileImg || authUser?.photoURL || '',
  };
};

export const withId = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

export const snapshotToArray = (snapshot) => {
  if (!snapshot.exists()) return [];
  const value = snapshot.val() || {};
  return Object.entries(value).map(([id, data]) => ({ id, ...data }));
};

export const likeMapToIds = (likes) => {
  if (Array.isArray(likes)) return likes;
  if (!likes || typeof likes !== 'object') return [];
  return Object.entries(likes)
    .filter(([, liked]) => !!liked)
    .map(([userId]) => userId);
};

export const normalizePost = (post, currentUserId = null) => {
  const likeUserIds = likeMapToIds(post.likeUserIds);
  return {
    ...post,
    created_at: toIso(post.created_at),
    updated_at: toIso(post.updated_at || post.created_at),
    view_count: Number(post.view_count || 0),
    like_count: likeUserIds.length,
    liked: currentUserId ? likeUserIds.includes(currentUserId) : false,
    tags: post.tags || [],
  };
};

export const normalizeComment = (comment, currentUserId = null) => {
  const likeUserIds = likeMapToIds(comment.likeUserIds);
  return {
    ...comment,
    created_at: toIso(comment.created_at),
    updated_at: toIso(comment.updated_at || comment.created_at),
    likes: likeUserIds.length,
    like_count: likeUserIds.length,
    liked: currentUserId ? likeUserIds.includes(currentUserId) : false,
  };
};
