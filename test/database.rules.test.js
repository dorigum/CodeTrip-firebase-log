import { readFile } from 'node:fs/promises';
import test, { after } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, set, update } from 'firebase/database';

const [host, port] = (process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? '127.0.0.1:9000').split(':');
const rules = await readFile(new URL('../database.rules.json', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({
  projectId: 'codetrip-rules-test',
  database: { host, port: Number(port), rules },
});

const ownerId = 'content-owner';
const likerId = 'regular-liker';
const otherId = 'another-user';
const targets = [
  { contentPath: 'boardPosts/post-1', likePath: 'likes/boardPosts/post-1', value: { post_id: 'post-1', user_id: ownerId, title: '게시글', view_count: 0, created_at: 1 } },
  { contentPath: 'boardComments/comment-1', likePath: 'likes/boardComments/comment-1', value: { comment_id: 'comment-1', post_id: 'post-1', user_id: ownerId, created_at: 1 } },
  { contentPath: 'boardCommentsByPost/post-1/comment-1', value: { comment_id: 'comment-1', user_id: ownerId, created_at: 1 } },
  { contentPath: 'travelComments/comment-1', likePath: 'likes/travelComments/comment-1', value: { comment_id: 'comment-1', content_id: 'content-1', user_id: ownerId, created_at: 1 } },
  { contentPath: 'travelCommentsByContent/content-1/comment-1', value: { comment_id: 'comment-1', user_id: ownerId, created_at: 1 } },
];

await testEnv.withSecurityRulesDisabled(async (context) => {
  const database = context.database();
  await Promise.all(targets.map(({ contentPath, value }) => set(ref(database, contentPath), value)));
  await set(ref(database, 'boardPosts/legacy-post'), {
    post_id: 'legacy-post',
    user_id: ownerId,
    title: '기존 좋아요가 있는 게시글',
    created_at: 1,
    likeUserIds: { [likerId]: true },
  });
  await set(ref(database, 'boardPostSummaries/post-1'), {
    user_id: ownerId,
    nickname: '작성자',
    title: '게시글',
    content_preview: '목록 미리보기',
    tags: [],
    view_count: 0,
    created_at: '2026-09-06T00:00:00.000Z',
    updated_at: '2026-09-06T00:00:00.000Z',
  });
});

after(async () => testEnv.cleanup());

for (const { contentPath } of targets) {
  test(`${contentPath}: 콘텐츠 작성자는 레거시 좋아요 맵을 추가·변경할 수 없다`, async () => {
    const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
    await assertFails(set(ref(ownerDatabase, `${contentPath}/likeUserIds/${otherId}`), true));
    await assertSucceeds(update(ref(ownerDatabase, contentPath), { updated_at: 2 }));
  });
}

for (const { contentPath, likePath } of targets.filter(({ likePath }) => likePath)) {
  test(`${contentPath}: 사용자는 분리된 좋아요 경로에서 자신의 키만 변경할 수 있다`, async () => {
    const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
    const likerDatabase = testEnv.authenticatedContext(likerId).database();

    await assertFails(set(ref(ownerDatabase, `${likePath}/${otherId}`), true));
    await assertSucceeds(set(ref(likerDatabase, `${likePath}/${likerId}`), true));
    await assertSucceeds(set(ref(likerDatabase, `${likePath}/${likerId}`), null));
  });
}

test('레거시 좋아요 맵을 유지한 콘텐츠의 일반 수정은 허용한다', async () => {
  const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
  await assertSucceeds(update(ref(ownerDatabase, 'boardPosts/legacy-post'), { title: '수정된 게시글' }));
});

test('게시글 요약은 클라이언트가 직접 수정·삭제할 수 없고 원본 게시글만 수정할 수 있다', async () => {
  const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
  const otherDatabase = testEnv.authenticatedContext(otherId).database();

  await assertFails(update(ref(ownerDatabase, 'boardPostSummaries/post-1'), { title: '단독 수정된 제목' }));
  await assertFails(update(ref(otherDatabase, 'boardPostSummaries/post-1'), { title: '위조된 제목' }));
  await assertFails(set(ref(ownerDatabase, 'boardPostSummaries/post-1'), null));
  await assertSucceeds(update(ref(ownerDatabase, 'boardPosts/post-1'), { title: '원본 수정된 게시글' }));
});

test('게시글 조회수는 로그인 사용자가 정확히 1만 증가시킬 수 있고 요약은 직접 수정할 수 없다', async () => {
  const otherDatabase = testEnv.authenticatedContext(otherId).database();

  await assertSucceeds(set(ref(otherDatabase, 'boardPosts/post-1/view_count'), 1));
  await assertFails(set(ref(otherDatabase, 'boardPosts/post-1/view_count'), 3));
  await assertFails(set(ref(otherDatabase, 'boardPostSummaries/post-1/view_count'), 1));
});

test('게시글 댓글과 인덱스를 같은 다중 경로 쓰기로 생성할 수 있다', async () => {
  const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
  const commentId = 'board-comment-created-with-index';

  await assertSucceeds(update(ref(ownerDatabase), {
    [`boardComments/${commentId}`]: { comment_id: commentId, post_id: 'post-1', user_id: ownerId, created_at: 1 },
    [`boardCommentsByPost/post-1/${commentId}`]: { comment_id: commentId, user_id: ownerId, created_at: 1 },
  }));
});

test('게시글 댓글 인덱스는 다른 작성자의 댓글이나 다른 게시글을 가리킬 수 없다', async () => {
  const otherDatabase = testEnv.authenticatedContext(otherId).database();
  const forgedCommentId = 'forged-board-comment';

  await assertFails(set(ref(otherDatabase, 'boardCommentsByPost/post-1/comment-1'), {
    comment_id: 'comment-1', user_id: otherId, created_at: 1,
  }));
  await assertFails(update(ref(otherDatabase), {
    [`boardComments/${forgedCommentId}`]: { comment_id: forgedCommentId, post_id: 'different-post', user_id: otherId, created_at: 1 },
    [`boardCommentsByPost/post-1/${forgedCommentId}`]: { comment_id: forgedCommentId, user_id: otherId, created_at: 1 },
  }));
});

test('여행지 댓글과 인덱스를 같은 다중 경로 쓰기로 생성할 수 있다', async () => {
  const ownerDatabase = testEnv.authenticatedContext(ownerId).database();
  const commentId = 'travel-comment-created-with-index';

  await assertSucceeds(update(ref(ownerDatabase), {
    [`travelComments/${commentId}`]: { comment_id: commentId, content_id: 'content-1', user_id: ownerId, created_at: 1 },
    [`travelCommentsByContent/content-1/${commentId}`]: { comment_id: commentId, user_id: ownerId, created_at: 1 },
  }));
});

test('여행지 댓글 인덱스는 다른 작성자의 댓글이나 다른 여행지를 가리킬 수 없다', async () => {
  const otherDatabase = testEnv.authenticatedContext(otherId).database();
  const forgedCommentId = 'forged-travel-comment';

  await assertFails(set(ref(otherDatabase, 'travelCommentsByContent/content-1/comment-1'), {
    comment_id: 'comment-1', user_id: otherId, created_at: 1,
  }));
  await assertFails(update(ref(otherDatabase), {
    [`travelComments/${forgedCommentId}`]: { comment_id: forgedCommentId, content_id: 'different-content', user_id: otherId, created_at: 1 },
    [`travelCommentsByContent/content-1/${forgedCommentId}`]: { comment_id: forgedCommentId, user_id: otherId, created_at: 1 },
  }));
});
