const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBoardPostNotification } = require('../boardPostNotifications');

test('다른 사용자의 댓글은 게시글 작성자 알림으로 변환한다', () => {
  assert.deepEqual(buildBoardPostNotification({
    postOwnerId: 'post-owner',
    actorId: 'commenter',
    actorNickname: '여행자',
    interaction: 'comment',
    createdAt: '2026-09-10T08:00:00.000Z',
  }), {
    user_id: 'post-owner',
    type: 'board_comment',
    message: '여행자님이 회원님의 게시글에 댓글을 남겼습니다.',
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
    createdAt: '2026-09-10T08:00:00.000Z',
  }), null);
});
