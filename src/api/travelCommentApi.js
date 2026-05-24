import { get, push, ref, remove, runTransaction, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, getStoredUser, likeMapToIds, normalizeComment, nowIso, snapshotToArray } from './firebaseHelpers';

export const getTravelComments = async (contentId) => {
  const currentUserId = getStoredUser()?.id || null;
  const comments = snapshotToArray(await get(ref(realtimeDb, 'travelComments')));
  return comments
    .filter((comment) => comment.content_id === String(contentId))
    .map((comment) => normalizeComment(comment, currentUserId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const toggleTravelCommentLike = async (commentId) => {
  const user = await getCurrentUser();
  let liked = false;
  let likes = 0;
  await runTransaction(ref(realtimeDb, `travelComments/${commentId}/likeUserIds`), (current = {}) => {
    const next = { ...current };
    if (next[user.id]) {
      delete next[user.id];
      liked = false;
    } else {
      next[user.id] = true;
      liked = true;
    }
    likes = likeMapToIds(next).length;
    return next;
  });
  return { liked, likes };
};

export const postTravelComment = async ({ contentId, nickname, body }) => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const commentRef = push(ref(realtimeDb, 'travelComments'));
  const comment = {
    content_id: String(contentId),
    user_id: user.id,
    nickname: nickname || user.name,
    body,
    likeUserIds: {},
    created_at,
    updated_at: created_at,
  };
  await set(commentRef, comment);

  const wishlists = snapshotToArray(await get(ref(realtimeDb, 'wishlists')));
  const targetUserIds = new Set(
    wishlists
      .filter((item) => item.contentId === String(contentId) && item.user_id !== user.id)
      .map((item) => item.user_id)
  );

  await Promise.all([...targetUserIds].map((userId) => {
    const notificationRef = push(ref(realtimeDb, 'notifications'));
    return set(notificationRef, {
      user_id: userId,
      message: `${nickname || user.name}님이 찜한 여행지에 댓글을 작성했습니다.`,
      content_id: String(contentId),
      is_read: false,
      created_at,
    });
  }));

  return { id: commentRef.key, ...comment };
};

export const updateTravelComment = async (id, body) => {
  const user = await getCurrentUser();
  const commentRef = ref(realtimeDb, `travelComments/${id}`);
  const snap = await get(commentRef);
  if (!snap.exists()) throw { message: '댓글을 찾을 수 없습니다.' };
  if (snap.val().user_id !== user.id) throw { message: '수정 권한이 없습니다.' };

  await update(commentRef, { body, updated_at: nowIso() });
  return { id, ...snap.val(), body };
};

export const deleteTravelComment = async (id) => {
  const user = await getCurrentUser();
  const commentRef = ref(realtimeDb, `travelComments/${id}`);
  const snap = await get(commentRef);
  if (!snap.exists()) return;
  if (snap.val().user_id !== user.id) throw { message: '삭제 권한이 없습니다.' };
  await remove(commentRef);
};
