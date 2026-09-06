import { endBefore, get, increment, limitToLast, orderByChild, push, query, ref, runTransaction, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import {
  getCurrentUser,
  getLikesByIds,
  getStoredUser,
  likeMapToIds,
  normalizeComment,
  normalizePost,
  nowIso,
  snapshotToArray,
} from './firebaseHelpers';

const getAllPosts = async () => {
  const posts = snapshotToArray(await get(ref(realtimeDb, 'boardPosts')));
  const likesByPostId = await getLikesByIds('boardPosts', posts.map(({ id }) => id));
  return posts.map((post) => ({
    ...post,
    likeUserIds: likesByPostId[post.id] ?? post.likeUserIds,
  }));
};
const userActivityPath = (uid, child) => `users/${uid}/activities/${child}`;
const boardPostSummaryPath = (postId = '') => `boardPostSummaries${postId ? `/${postId}` : ''}`;
const boardCommentIndexPath = (postId, commentId = '') =>
  `boardCommentsByPost/${postId}${commentId ? `/${commentId}` : ''}`;

const createContentPreview = (content) => String(content || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 240);

const toBoardPostSummary = (post) => ({
  user_id: post.user_id,
  nickname: post.nickname,
  title: post.title,
  content_preview: createContentPreview(post.content),
  tags: post.tags || [],
  view_count: Number(post.view_count || 0),
  created_at: post.created_at,
  updated_at: post.updated_at || post.created_at,
});

const getActivityIds = async (uid, child) => {
  const snap = await get(ref(realtimeDb, userActivityPath(uid, child)));
  return Object.keys(snap.val() || {});
};

const getBoardCommentCountsByPostIds = async (ids) => {
  const uniqueIds = [...new Set(ids)];
  const snapshots = await Promise.all(
    uniqueIds.map(async (id) => [id, (await get(ref(realtimeDb, boardCommentIndexPath(id)))).size])
  );
  return Object.fromEntries(snapshots);
};

const getPostsByIds = async (ids, currentUserId, commentCounts = null) => {
  if (!ids.length) return [];
  const [postSnaps, counts, likesByPostId] = await Promise.all([
    Promise.all(ids.map((id) => get(ref(realtimeDb, `boardPosts/${id}`)).then((snap) => ({ id, snap })))),
    commentCounts ? Promise.resolve(commentCounts) : getBoardCommentCountsByPostIds(ids),
    getLikesByIds('boardPosts', ids),
  ]);
  return sortPosts(
    postSnaps
      .filter(({ snap }) => snap.exists())
      .map(({ id, snap }) => ({
        ...normalizePost({ id, ...snap.val(), likeUserIds: likesByPostId[id] ?? snap.val().likeUserIds }, currentUserId),
        comment_count: counts[id] || 0,
      })),
    'created_at'
  );
};

const sortPosts = (posts, sort) => {
  const sorted = [...posts];
  if (sort === 'likes') {
    sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0) || new Date(b.created_at) - new Date(a.created_at) || (b.id && a.id ? b.id.localeCompare(a.id) : 0));
  } else if (sort === 'updated_at') {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at) || (b.id && a.id ? b.id.localeCompare(a.id) : 0));
  } else {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || (b.id && a.id ? b.id.localeCompare(a.id) : 0));
  }
  return sorted;
};

const getRecentBoardPostsPage = async ({ cursor, numOfRows, currentUserId }) => {
  const pageSize = Math.max(1, Number(numOfRows) || 10);
  const constraints = [orderByChild('created_at')];
  if (cursor?.createdAt && cursor?.id) {
    constraints.push(endBefore(cursor.createdAt, cursor.id));
  }
  constraints.push(limitToLast(pageSize + 1));

  const pageCandidates = snapshotToArray(await get(query(ref(realtimeDb, boardPostSummaryPath()), ...constraints)));
  const hasNext = pageCandidates.length > pageSize;
  const pagePosts = hasNext ? pageCandidates.slice(1) : pageCandidates;
  const [commentCounts, likesByPostId] = await Promise.all([
    getBoardCommentCountsByPostIds(pagePosts.map(({ id }) => id)),
    getLikesByIds('boardPosts', pagePosts.map(({ id }) => id)),
  ]);
  const posts = sortPosts(
    pagePosts.map((post) => ({
      ...normalizePost({ ...post, content: post.content_preview, likeUserIds: likesByPostId[post.id] ?? post.likeUserIds }, currentUserId),
      comment_count: commentCounts[post.id] || 0,
    })),
    'created_at'
  );
  const oldestPost = pagePosts[0];

  return {
    posts,
    totalCount: null,
    paginationMode: 'cursor',
    hasNext,
    nextCursor: hasNext && oldestPost
      ? { createdAt: oldestPost.created_at, id: oldestPost.id }
      : null,
  };
};

export const getBoardPosts = async ({ pageNo = 1, numOfRows = 10, keyword = '', sort = 'created_at', cursor = null } = {}) => {
  const currentUserId = getStoredUser()?.id || null;
  if (!keyword.trim() && sort === 'created_at') {
    return getRecentBoardPostsPage({ cursor, numOfRows, currentUserId });
  }

  const posts = await getAllPosts();
  const commentCounts = await getBoardCommentCountsByPostIds(posts.map(({ id }) => id));

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
    paginationMode: 'offset',
    hasNext: pageNo * numOfRows < sorted.length,
    nextCursor: null,
  };
};

export const getBoardPost = async (id) => {
  const currentUserId = getStoredUser()?.id || null;
  const postRef = ref(realtimeDb, `boardPosts/${id}`);
  const [snap, likesSnapshot] = await Promise.all([
    get(postRef),
    get(ref(realtimeDb, `likes/boardPosts/${id}`)),
  ]);
  if (!snap.exists()) throw { message: '게시글을 찾을 수 없습니다.' };

  const post = snap.val();
  await update(ref(realtimeDb), {
    [`boardPosts/${id}/view_count`]: increment(1),
    [`${boardPostSummaryPath(id)}/view_count`]: increment(1),
  });
  return normalizePost({ id, ...post, likeUserIds: likesSnapshot.val() ?? post.likeUserIds, view_count: Number(post.view_count || 0) + 1 }, currentUserId);
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
    created_at,
    updated_at: created_at,
  };
  await update(ref(realtimeDb), {
    [`boardPosts/${postRef.key}`]: post,
    [boardPostSummaryPath(postRef.key)]: toBoardPostSummary(post),
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
  const nextPost = {
    ...snap.val(),
    title,
    content,
    tags: tags.map((tag, index) => ({ id: tag.id || `${Date.now()}-${index}`, ...tag })),
    updated_at,
  };
  await update(ref(realtimeDb), {
    [`boardPosts/${id}`]: nextPost,
    [boardPostSummaryPath(id)]: toBoardPostSummary(nextPost),
    [userActivityPath(user.id, `boardPosts/${id}`)]: {
      post_id: id,
      title,
      created_at: snap.val().created_at || updated_at,
      updated_at,
    },
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
    [boardPostSummaryPath(id)]: null,
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
  const [commentSnaps, likesByCommentId] = await Promise.all([
    Promise.all(ids.map((id) => get(ref(realtimeDb, `boardComments/${id}`)).then((snap) => ({ id, snap })))),
    getLikesByIds('boardComments', ids),
  ]);
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => normalizeComment({ id, ...snap.val(), likeUserIds: likesByCommentId[id] ?? snap.val().likeUserIds }, currentUserId))
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

const toggleLike = async (likeType, id) => {
  const user = await getCurrentUser();
  const likePath = `likes/${likeType}/${id}`;
  const likeUserRef = ref(realtimeDb, `${likePath}/${user.id}`);
  const transaction = await runTransaction(likeUserRef, (current) => {
    const nextLiked = !current;
    return nextLiked ? true : null;
  });
  const liked = transaction.snapshot.val() === true;
  const likeSnapshot = await get(ref(realtimeDb, likePath));
  const likes = likeMapToIds(likeSnapshot.val()).length;
  if (likeType === 'boardPosts') {
    const postId = id;
    await update(ref(realtimeDb), {
      [userActivityPath(user.id, `likedPosts/${postId}`)]: liked
        ? { post_id: postId, created_at: nowIso() }
        : null,
    });
  }
  return { liked, likes };
};

export const toggleBoardPostLike = async (id) => toggleLike('boardPosts', id);
export const toggleBoardCommentLike = async (id) => toggleLike('boardComments', id);

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
  const [commentSnaps, likesByCommentId] = await Promise.all([
    Promise.all(ids.map((id) => get(ref(realtimeDb, `boardComments/${id}`)).then((snap) => ({ id, snap })))),
    getLikesByIds('boardComments', ids),
  ]);
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => ({
      ...normalizeComment({ id, ...snap.val(), likeUserIds: likesByCommentId[id] ?? snap.val().likeUserIds }, user.id),
      post_title: activityMap[id]?.post_title || '',
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getMyTravelComments = async () => {
  const user = await getCurrentUser();
  const ids = await getActivityIds(user.id, 'travelComments');
  if (!ids.length) return [];
  const [commentSnaps, likesByCommentId] = await Promise.all([
    Promise.all(ids.map((id) => get(ref(realtimeDb, `travelComments/${id}`)).then((snap) => ({ id, snap })))),
    getLikesByIds('travelComments', ids),
  ]);
  return commentSnaps
    .filter(({ snap }) => snap.exists())
    .map(({ id, snap }) => normalizeComment({ id, ...snap.val(), likeUserIds: likesByCommentId[id] ?? snap.val().likeUserIds }, user.id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};
