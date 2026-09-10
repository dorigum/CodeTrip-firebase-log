const isExternalPostInteraction = (postOwnerId, actorId) => (
  typeof postOwnerId === 'string'
  && postOwnerId.trim() !== ''
  && typeof actorId === 'string'
  && actorId.trim() !== ''
  && postOwnerId !== actorId
);

const buildBoardPostNotification = ({ postOwnerId, actorId, actorNickname, interaction, createdAt }) => {
  if (!isExternalPostInteraction(postOwnerId, actorId)) return null;

  const isComment = interaction === 'comment';
  return {
    user_id: postOwnerId,
    type: isComment ? 'board_comment' : 'board_like',
    message: `${String(actorNickname || '다른 사용자').trim() || '다른 사용자'}님이 회원님의 게시글에 ${isComment ? '댓글을 남겼습니다.' : '좋아요를 눌렀습니다.'}`,
    is_read: false,
    created_at: createdAt,
  };
};

module.exports = {
  buildBoardPostNotification,
  isExternalPostInteraction,
};
