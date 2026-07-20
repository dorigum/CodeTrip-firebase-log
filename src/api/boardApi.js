import { get, push, ref, runTransaction, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import {
  getCurrentUser,
  getStoredUser,
  likeMapToIds,
  normalizeComment,
  normalizePost,
  nowIso,
  snapshotToArray,
} from './firebaseHelpers';

const getAllPosts = async () => snapshotToArray(await get(ref(realtimeDb, 'boardPosts')));
const userActivityPath = (uid, child) => `users/${uid}/activities/${child}`;
const boardCommentIndexPath = (postId, commentId = '') =>
  `boardCommentsByPost/${postId}${commentId ? `/${commentId}` : ''}`;

const getActivityIds = async (uid, child) => {
  const snap = await get(ref(realtimeDb, userActivityPath(uid, child)));
  return Object.keys(snap.val() || {});
};

const getBoardCommentCounts = async () => {
  const snap = await get(ref(realtimeDb, 'boardCommentsByPost'));
  const value = snap.val() || {};
  return Object.fromEntries(
    Object.entries(value).map(([postId, comments]) => [postId, Object.keys(comments || {}).length])
  );
};

const getPostsByIds = async (ids, currentUserId, commentCounts = null) => {
  if (!ids.length) return [];
  const [postSnaps, counts] = await Promise.all([
    Promise.all(ids.map((id) => get(ref(realtimeDb, `boardPosts/${id}`)).then((snap) => ({ id, snap })))),
    commentCounts ? Promise.resolve(commentCounts) : getBoardCommentCounts(),
  ]);
  return sortPosts(
    postSnaps
      .filter(({ snap }) => snap.exists())
      .map(({ id, snap }) => ({
        ...normalizePost({ id, ...snap.val() }, currentUserId),
        comment_count: counts[id] || 0,
      })),
    'created_at'
  );
};

const sortPosts = (posts, sort) => {
  const sorted = [...posts];
  if (sort === 'likes') {
    sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0) || new Date(b.created_at) - new Date(a.created_at));
  } else if (sort === 'updated_at') {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } else {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return sorted;
};

export const getBoardPosts = async ({ pageNo = 1, numOfRows = 10, keyword = '', sort = 'created_at' } = {}) => {
  const currentUserId = getStoredUser()?.id || null;
  const [posts, commentCounts] = await Promise.all([getAllPosts(), getBoardCommentCounts()]);

  const normalized = posts.map((post) => ({
    ...normalizePost(post, currentUserId),
    comment_count: commentCounts[post.id] || 0,
  }));

  const lowerKeyword = keyword.trim().toLowerCase();
  const filtered = lowerKeyword
    ? normalized.filter((post) =>
        post.title?.toLowerCase().includes(lowerKeyword) ||
        post.content?.toLowerCase().includes(lowerKeyword) ||
        post.tags?.some((tag) => tag.title?.toLowerCase().includes(lowerKeyword)))
    : normalized;

  const sorted = sortPosts(filtered, sort);
  const start = (pageNo - 1) * numOfRows;
  return {
    posts: sorted.slice(start, start + numOfRows),
    totalCount: sorted.length,
  };
};

export const getBoardPost = async (id) => {
  const currentUserId = getStoredUser()?.id || null;
  const postRef = ref(realtimeDb, `boardPosts/${id}`);
  const snap = await get(postRef);
  if (!snap.exists()) throw { message: '게시글을 찾을 수 없습니다.' };

  const post = snap.val();
  const nextViewCount = Number(post.view_count || 0) + 1;
  await update(postRef, { view_count: nextViewCount });
  return normalizePost({ id, ...post, view_count: nextViewCount }, currentUserId);
};

export const createBoardPost = async ({ title, content, tags = [] }) => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const postRef = push(ref(realtimeDb, 'boardPosts'));
  const post = {
    user_id: user.id,
    nickname: user.name,
    title,
    content,
    tags: tags.map((tag, index) => ({ id: `${Date.now()}-${index}`, ...tag })),
    view_count: 0,
    likeUserIds: {},
    created_at,
    updated_at: created_at,
  };
  await update(ref(realtimeDb), {
    [`boardPosts/${postRef.key}`]: post,
    [userActivityPath(user.id, `boardPosts/${postRef.key}`)]: {
      post_id: postRef.key,
      title,
      created_at,
    },
  });
  return { id: postRef.key };
};

export const updateBoardPost = async (id, { title, content, tags = [] }) => {
  const user = await getCurrentUser();
  const postRef = ref(realtimeDb, `boardPosts/${id}`);
  const snap = await get(postRef);
  if (!snap.exists()) throw { message: '게시글을 찾을 수 없습니다.' };
  if (snap.val().user_id !== user.id) throw { message: '수정 권한이 없습니다.' };

  const updated_at = nowIso();
  await update(postRef, {
    title,
    content,
    tags: tags.map((tag, index) => ({ id: tag.id || `${Date.now()}-${index}`, ...tag })),
    updated_at,
  });
  await update(ref(realtimeDb, userActivityPath(user.id, `boardPosts/${id}`)), {
    post_id: id,
    title,
    created_at: snap.val().created_at || updated_at,
    updated_at,
  });
  return { message: '수정했습니다.' };
};

export const deleteBoardPost = async (id) => {
  const user = await getCurrentUser();
  const postSnap = await get(ref(realtimeDb, `boardPosts/${id}`));
  if (!postSnap.exists()) return;
  if (postSnap.val().user_id !== user.id) throw { message: '삭제 권한이 없습니다.' };

  const updates = {
    [`boardPosts/${id}`]: null,
    [boardCommentIndexPath(id)]: null,
    [userActivityPath(user.id, `boardPosts/${id}`)]: null,
    [userActivityPath(user.id, `likedPosts/${id}`)]: null,
  };
  await update(ref(realtimeDb), updates);
};

export const getBoardComments = async (postId) => {
  const currentUserId = getStoredUser()?.id || null;
  const indexSnap = await get(ref(realtimeDb, boardCommentIndexPath(postId)));
  const ids = Object.keys(indexSnap.val() || {});
  if (!ids.length) return [];
  const commentSnaps = await Promise.all(
    ids.map((id) => get(ref(realtimeDb, `boardComments/${id}`)).then((snap) => ({ id, snap })))
  );
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => normalizeComment({ id, ...snap.val() }, currentUserId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

export const createBoardComment = async (postId, body) => {
  const user = await getCurrentUser();
  const postSnap = await get(ref(realtimeDb, `boardPosts/${postId}`));
  if (!postSnap.exists()) throw { message: '게시글을 찾을 수 없습니다.' };

  const created_at = nowIso();
  const commentRef = push(ref(realtimeDb, 'boardComments'));
  const comment = {
    post_id: String(postId),
    user_id: user.id,
    nickname: user.name,
    body,
    likeUserIds: {},
    created_at,
    updated_at: created_at,
  };
  await update(ref(realtimeDb), {
    [`boardComments/${commentRef.key}`]: comment,
    [boardCommentIndexPath(postId, commentRef.key)]: {
      comment_id: commentRef.key,
      user_id: user.id,
      created_at,
    },
    [userActivityPath(user.id, `boardComments/${commentRef.key}`)]: {
      comment_id: commentRef.key,
      post_id: String(postId),
      post_title: postSnap.val().title || '',
      created_at,
    },
  });

  return { id: commentRef.key, ...comment, likes: 0, liked: false };
};

export const updateBoardComment = async (id, body) => {
  const user = await getCurrentUser();
  const commentRef = ref(realtimeDb, `boardComments/${id}`);
  const snap = await get(commentRef);
  if (!snap.exists()) throw { message: '댓글을 찾을 수 없습니다.' };
  if (snap.val().user_id !== user.id) throw { message: '수정 권한이 없습니다.' };

  await update(commentRef, { body, updated_at: nowIso() });
  return normalizeComment({ id, ...snap.val(), body }, user.id);
};

export const deleteBoardComment = async (id) => {
  const user = await getCurrentUser();
  const commentRef = ref(realtimeDb, `boardComments/${id}`);
  const snap = await get(commentRef);
  if (!snap.exists()) return;
  if (snap.val().user_id !== user.id) throw { message: '삭제 권한이 없습니다.' };
  await update(ref(realtimeDb), {
    [`boardComments/${id}`]: null,
    [boardCommentIndexPath(snap.val().post_id, id)]: null,
    [userActivityPath(user.id, `boardComments/${id}`)]: null,
  });
};

const toggleLike = async (path) => {
  const user = await getCurrentUser();
  let liked = false;
  let likes = 0;
  await runTransaction(ref(realtimeDb, `${path}/likeUserIds`), (current = {}) => {
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
  if (path.startsWith('boardPosts/')) {
    const postId = path.split('/')[1];
    await update(ref(realtimeDb), {
      [userActivityPath(user.id, `likedPosts/${postId}`)]: liked
        ? { post_id: postId, created_at: nowIso() }
        : null,
    });
  }
  return { liked, likes };
};

export const toggleBoardPostLike = async (id) => toggleLike(`boardPosts/${id}`);
export const toggleBoardCommentLike = async (id) => toggleLike(`boardComments/${id}`);

export const getMyBoardPosts = async () => {
  const user = await getCurrentUser();
  const ids = await getActivityIds(user.id, 'boardPosts');
  return getPostsByIds(ids, user.id);
};

export const getMyLikedPosts = async () => {
  const user = await getCurrentUser();
  const ids = await getActivityIds(user.id, 'likedPosts');
  return getPostsByIds(ids, user.id);
};

export const getMyBoardComments = async () => {
  const user = await getCurrentUser();
  const ids = await getActivityIds(user.id, 'boardComments');
  if (!ids.length) return [];
  const activitySnap = await get(ref(realtimeDb, userActivityPath(user.id, 'boardComments')));
  const activityMap = activitySnap.val() || {};
  const commentSnaps = await Promise.all(
    ids.map((id) => get(ref(realtimeDb, `boardComments/${id}`)).then((snap) => ({ id, snap })))
  );
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => ({
      ...normalizeComment({ id, ...snap.val() }, user.id),
      post_title: activityMap[id]?.post_title || '',
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getMyTravelComments = async () => {
  const user = await getCurrentUser();
  const ids = await getActivityIds(user.id, 'travelComments');
  if (!ids.length) return [];
  const commentSnaps = await Promise.all(
    ids.map((id) => get(ref(realtimeDb, `travelComments/${id}`)).then((snap) => ({ id, snap })))
  );
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => normalizeComment({ id, ...snap.val() }, user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};
