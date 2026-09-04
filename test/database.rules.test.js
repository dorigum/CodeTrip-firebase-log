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
  { contentPath: 'boardPosts/post-1', likePath: 'likes/boardPosts/post-1', value: { post_id: 'post-1', user_id: ownerId, title: '게시글', created_at: 1 } },
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
