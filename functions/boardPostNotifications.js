const isExternalPostInteraction = (postOwnerId, actorId) => (
  typeof postOwnerId === 'string'
  && postOwnerId.trim() !== ''
  && typeof actorId === 'string'
  && actorId.trim() !== ''
  && postOwnerId !== actorId
);

const compactCommentBody = (value) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80);

const getProfileDisplayName = (profile = {}) => {
  const name = String(profile.name || '').trim()
    || String(profile.nickname || '').trim();
  if (name) return name;
  return String(profile.email || '').split('@')[0].trim() || 'CodeTrip 사용자';
};

const buildBoardPostNotification = ({ postOwnerId, actorId, actorNickname, interaction, postId, commentBody, createdAt }) => {
  if (!isExternalPostInteraction(postOwnerId, actorId)) return null;

  const actorName = String(actorNickname || '다른 사용자').trim() || '다른 사용자';
  const isComment = interaction === 'comment';
  const isCommentLike = interaction === 'comment_like';
  const commentPreview = compactCommentBody(commentBody);
  return {
    user_id: postOwnerId,
    type: isCommentLike ? 'board_comment_like' : (isComment ? 'board_comment' : 'board_like'),
    content_id: `/board/${postId}`,
    message: isCommentLike
      ? `${actorName}님이 회원님의 댓글에 좋아요를 눌렀습니다.${commentPreview ? ` “${commentPreview}”` : ''}`
      : `${actorName}님이 회원님의 게시글에 ${isComment ? '댓글을 남겼습니다.' : '좋아요를 눌렀습니다.'}`,
    is_read: false,
    created_at: createdAt,
  };
};

module.exports = {
  buildBoardPostNotification,
  compactCommentBody,
  getProfileDisplayName,
  isExternalPostInteraction,
};
