import { get, push, ref, remove, runTransaction, set, update } from 'firebase/database';
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
const getAllComments = async () => snapshotToArray(await get(ref(realtimeDb, 'boardComments')));

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
  const [posts, comments] = await Promise.all([getAllPosts(), getAllComments()]);
  const commentCounts = comments.reduce((acc, comment) => {
    acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
    return acc;
  }, {});

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
  await set(postRef, {
    user_id: user.id,
    nickname: user.name,
    title,
    content,
    tags: tags.map((tag, index) => ({ id: `${Date.now()}-${index}`, ...tag })),
    view_count: 0,
    likeUserIds: {},
    created_at,
    updated_at: created_at,
  });
  return { id: postRef.key };
};

export const updateBoardPost = async (id, { title, content, tags = [] }) => {
  const user = await getCurrentUser();
  const postRef = ref(realtimeDb, `boardPosts/${id}`);
  const snap = await get(postRef);
  if (!snap.exists()) throw { message: '게시글을 찾을 수 없습니다.' };
  if (snap.val().user_id !== user.id) throw { message: '수정 권한이 없습니다.' };

  await update(postRef, {
    title,
    content,
    tags: tags.map((tag, index) => ({ id: tag.id || `${Date.now()}-${index}`, ...tag })),
    updated_at: nowIso(),
  });
  return { message: '수정했습니다.' };
};

export const deleteBoardPost = async (id) => {
  const user = await getCurrentUser();
  const postSnap = await get(ref(realtimeDb, `boardPosts/${id}`));
  if (!postSnap.exists()) return;
  if (postSnap.val().user_id !== user.id) throw { message: '삭제 권한이 없습니다.' };

  const comments = await getAllComments();
  const updates = { [`boardPosts/${id}`]: null };
  comments
    .filter((comment) => comment.post_id === String(id))
    .forEach((comment) => { updates[`boardComments/${comment.id}`] = null; });
  await update(ref(realtimeDb), updates);
};

export const getBoardComments = async (postId) => {
  const currentUserId = getStoredUser()?.id || null;
  const comments = await getAllComments();
  return comments
    .filter((comment) => comment.post_id === String(postId))
    .map((comment) => normalizeComment(comment, currentUserId))
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
  await set(commentRef, comment);

  const post = postSnap.val();
  if (post.user_id !== user.id) {
    const notificationRef = push(ref(realtimeDb, 'notifications'));
    await set(notificationRef, {
      user_id: post.user_id,
      message: `${user.name}님이 게시글 '${post.title}'에 댓글을 작성했습니다.`,
      content_id: `/board/${postId}`,
      is_read: false,
      created_at,
    });
  }

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
  await remove(commentRef);
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
  return { liked, likes };
};

export const toggleBoardPostLike = async (id) => toggleLike(`boardPosts/${id}`);
export const toggleBoardCommentLike = async (id) => toggleLike(`boardComments/${id}`);

export const getMyBoardPosts = async () => {
  const user = await getCurrentUser();
  const [posts, comments] = await Promise.all([getAllPosts(), getAllComments()]);
  return sortPosts(posts
    .filter((post) => post.user_id === user.id)
    .map((post) => ({
      ...normalizePost(post, user.id),
      comment_count: comments.filter((comment) => comment.post_id === post.id).length,
    })), 'created_at');
};

export const getMyLikedPosts = async () => {
  const user = await getCurrentUser();
  const [posts, comments] = await Promise.all([getAllPosts(), getAllComments()]);
  return sortPosts(posts
    .filter((post) => !!post.likeUserIds?.[user.id])
    .map((post) => ({
      ...normalizePost(post, user.id),
      comment_count: comments.filter((comment) => comment.post_id === post.id).length,
    })), 'created_at');
};

export const getMyBoardComments = async () => {
  const user = await getCurrentUser();
  const [comments, posts] = await Promise.all([getAllComments(), getAllPosts()]);
  const postMap = Object.fromEntries(posts.map((post) => [post.id, post]));
  return comments
    .filter((comment) => comment.user_id === user.id)
    .map((comment) => ({
      ...normalizeComment(comment, user.id),
      post_title: postMap[comment.post_id]?.title || '',
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getMyTravelComments = async () => {
  const user = await getCurrentUser();
  const snap = await get(ref(realtimeDb, 'travelComments'));
  return snapshotToArray(snap)
    .filter((comment) => comment.user_id === user.id)
    .map((comment) => normalizeComment(comment, user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};
