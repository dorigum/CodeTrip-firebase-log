const asRecord = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const getOwnerId = (value) => String(value?.user_id ?? value?.userId ?? '');

const getReferenceId = (value, primaryKey, alternateKey) => (
  String(value?.[primaryKey] ?? value?.[alternateKey] ?? '')
);

const addUserLikeRemovals = (updates, likesByContent, collectionName, userId, removedContentIds) => {
  Object.entries(asRecord(likesByContent)).forEach(([contentId, likes]) => {
    if (removedContentIds.has(String(contentId))) return;
    if (Object.prototype.hasOwnProperty.call(asRecord(likes), userId)) {
      updates[`likes/${collectionName}/${contentId}/${userId}`] = null;
    }
  });
};

const addActorNotificationRemovals = (updates, users, userId) => {
  Object.entries(asRecord(users)).forEach(([ownerId, profile]) => {
    Object.entries(asRecord(profile?.notifications)).forEach(([notificationId, notification]) => {
      if (String(notification?.actor_id ?? notification?.actorId ?? '') === userId) {
        updates[`users/${ownerId}/notifications/${notificationId}`] = null;
      }
    });
  });
};

const buildAccountDeletionUpdates = ({
  userId,
  users,
  boardPosts,
  boardComments,
  travelComments,
  likes,
}) => {
  const updates = { [`users/${userId}`]: null };
  const postRecords = asRecord(boardPosts);
  const boardCommentRecords = asRecord(boardComments);
  const travelCommentRecords = asRecord(travelComments);
  const likeRecords = asRecord(likes);

  const removedPostIds = new Set(
    Object.entries(postRecords)
      .filter(([, post]) => getOwnerId(post) === userId)
      .map(([postId]) => String(postId)),
  );

  removedPostIds.forEach((postId) => {
    updates[`boardPosts/${postId}`] = null;
    updates[`boardPostSummaries/${postId}`] = null;
    updates[`boardCommentsByPost/${postId}`] = null;
    updates[`likes/boardPosts/${postId}`] = null;
  });

  const removedBoardCommentIds = new Set(
    Object.entries(boardCommentRecords)
      .filter(([, comment]) => (
        getOwnerId(comment) === userId
        || removedPostIds.has(getReferenceId(comment, 'post_id', 'postId'))
      ))
      .map(([commentId]) => String(commentId)),
  );

  removedBoardCommentIds.forEach((commentId) => {
    const comment = boardCommentRecords[commentId];
    const postId = getReferenceId(comment, 'post_id', 'postId');
    updates[`boardComments/${commentId}`] = null;
    updates[`likes/boardComments/${commentId}`] = null;
    if (postId && !removedPostIds.has(postId)) {
      updates[`boardCommentsByPost/${postId}/${commentId}`] = null;
    }
  });

  const removedTravelCommentIds = new Set(
    Object.entries(travelCommentRecords)
      .filter(([, comment]) => getOwnerId(comment) === userId)
      .map(([commentId]) => String(commentId)),
  );

  removedTravelCommentIds.forEach((commentId) => {
    const comment = travelCommentRecords[commentId];
    const contentId = getReferenceId(comment, 'content_id', 'contentId');
    updates[`travelComments/${commentId}`] = null;
    updates[`likes/travelComments/${commentId}`] = null;
    if (contentId) updates[`travelCommentsByContent/${contentId}/${commentId}`] = null;
  });

  addUserLikeRemovals(updates, likeRecords.boardPosts, 'boardPosts', userId, removedPostIds);
  addUserLikeRemovals(updates, likeRecords.boardComments, 'boardComments', userId, removedBoardCommentIds);
  addUserLikeRemovals(updates, likeRecords.travelComments, 'travelComments', userId, removedTravelCommentIds);
  addActorNotificationRemovals(updates, users, userId);

  return updates;
};

module.exports = { buildAccountDeletionUpdates };
