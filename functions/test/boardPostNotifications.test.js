const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBoardPostNotification, getProfileDisplayName } = require('../boardPostNotifications');

test('다른 사용자의 댓글은 게시글 작성자 알림으로 변환한다', () => {
  assert.deepEqual(buildBoardPostNotification({
    postOwnerId: 'post-owner',
    actorId: 'commenter',
    actorNickname: '여행자',
    interaction: 'comment',
    postId: 'post-1',
    createdAt: '2026-09-10T08:00:00.000Z',
  }), {
    user_id: 'post-owner',
    type: 'board_comment',
    content_id: '/board/post-1',
    message: '여행자님이 회원님의 게시글에 댓글을 남겼습니다.',
    is_read: false,
    created_at: '2026-09-10T08:00:00.000Z',
  });
});

test('다른 사용자의 댓글 좋아요는 댓글 내용과 함께 댓글 작성자에게 알린다', () => {
  assert.deepEqual(buildBoardPostNotification({
    postOwnerId: 'comment-owner',
    actorId: 'liker',
    actorNickname: '좋아요 사용자',
    interaction: 'comment_like',
    postId: 'post-1',
    commentBody: '비 오는 날에 방문하기 좋았어요.',
    createdAt: '2026-09-10T08:00:00.000Z',
  }), {
    user_id: 'comment-owner',
    type: 'board_comment_like',
    content_id: '/board/post-1',
    message: '좋아요 사용자님이 회원님의 댓글에 좋아요를 눌렀습니다. “비 오는 날에 방문하기 좋았어요.”',
    is_read: false,
    created_at: '2026-09-10T08:00:00.000Z',
  });
});

test('게시글 작성자의 자체 댓글·좋아요에는 알림을 만들지 않는다', () => {
  assert.equal(buildBoardPostNotification({
    postOwnerId: 'post-owner',
    actorId: 'post-owner',
    actorNickname: '작성자',
    interaction: 'like',
    postId: 'post-1',
    createdAt: '2026-09-10T08:00:00.000Z',
  }), null);
});

test('프로필 이름이 없으면 이메일 앞부분을 알림 작성자 이름으로 사용한다', () => {
  assert.equal(getProfileDisplayName({ email: 'traveler@example.com' }), 'traveler');
  assert.equal(getProfileDisplayName({ name: ' ', nickname: '여행자', email: 'traveler@example.com' }), '여행자');
  assert.equal(getProfileDisplayName({}), 'CodeTrip 사용자');
});
