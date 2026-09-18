const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAccountDeletionUpdates } = require('../accountDeletion');

test('회원 탈퇴는 개인 데이터와 작성 콘텐츠, 연결 인덱스를 함께 제거한다', () => {
  const updates = buildAccountDeletionUpdates({
    userId: 'user-a',
    users: {
      'user-b': {
        notifications: {
          'notification-a': { actor_id: 'user-a' },
          'notification-b': { actor_id: 'user-c' },
          'legacy-notification': { message: '기존 알림' },
        },
      },
    },
    boardPosts: {
      'post-a': { user_id: 'user-a' },
      'post-b': { user_id: 'user-b' },
    },
    boardComments: {
      'comment-a': { user_id: 'user-a', post_id: 'post-b' },
      'comment-b': { user_id: 'user-b', post_id: 'post-a' },
    },
    travelComments: {
      'travel-a': { user_id: 'user-a', content_id: 'place-a' },
      'travel-b': { user_id: 'user-b', content_id: 'place-a' },
    },
    likes: {
      boardPosts: { 'post-b': { 'user-a': true, 'user-c': true } },
      boardComments: { 'comment-c': { 'user-a': true } },
      travelComments: { 'travel-b': { 'user-a': true } },
    },
  });

  assert.equal(updates['users/user-a'], null);
  assert.equal(updates['boardPosts/post-a'], null);
  assert.equal(updates['boardPostSummaries/post-a'], null);
  assert.equal(updates['boardCommentsByPost/post-a'], null);
  assert.equal(updates['boardComments/comment-a'], null);
  assert.equal(updates['boardComments/comment-b'], null);
  assert.equal(updates['boardCommentsByPost/post-b/comment-a'], null);
  assert.equal(updates['travelComments/travel-a'], null);
  assert.equal(updates['travelCommentsByContent/place-a/travel-a'], null);
  assert.equal(updates['likes/boardPosts/post-b/user-a'], null);
  assert.equal(updates['likes/boardComments/comment-c/user-a'], null);
  assert.equal(updates['likes/travelComments/travel-b/user-a'], null);
  assert.equal(updates['users/user-b/notifications/notification-a'], null);
  assert.equal(updates['users/user-b/notifications/notification-b'], undefined);
  assert.equal(updates['users/user-b/notifications/legacy-notification'], undefined);
  assert.equal(updates['travelComments/travel-b'], undefined);
});
