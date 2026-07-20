import { get, push, ref, runTransaction, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, getStoredUser, likeMapToIds, normalizeComment, nowIso } from './firebaseHelpers';

const userActivityPath = (uid, child) => `users/${uid}/activities/${child}`;
const travelCommentIndexPath = (contentId, commentId = '') =>
  `travelCommentsByContent/${contentId}${commentId ? `/${commentId}` : ''}`;

export const getTravelComments = async (contentId) => {
  const currentUserId = getStoredUser()?.id || null;
  const indexSnap = await get(ref(realtimeDb, travelCommentIndexPath(contentId)));
  const ids = Object.keys(indexSnap.val() || {});
  if (!ids.length) return [];

  const commentSnaps = await Promise.all(
    ids.map((id) => get(ref(realtimeDb, `travelComments/${id}`)).then((snap) => ({ id, snap })))
  );

  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => normalizeComment({ id, ...snap.val() }, currentUserId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

  await update(ref(realtimeDb), {
    [`travelComments/${commentRef.key}`]: comment,
    [travelCommentIndexPath(contentId, commentRef.key)]: {
      comment_id: commentRef.key,
      user_id: user.id,
      created_at,
    },
    [userActivityPath(user.id, `travelComments/${commentRef.key}`)]: {
      comment_id: commentRef.key,
      content_id: String(contentId),
      created_at,
    },
  });

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

  await update(ref(realtimeDb), {
    [`travelComments/${id}`]: null,
    [travelCommentIndexPath(snap.val().content_id, id)]: null,
    [userActivityPath(user.id, `travelComments/${id}`)]: null,
  });
};
