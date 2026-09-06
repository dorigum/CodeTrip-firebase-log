const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
if (!projectId) {
  throw new Error('GOOGLE_CLOUD_PROJECT 환경 변수를 설정하세요.');
}

initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`,
});

const commit = process.argv.includes('--commit');
const BATCH_SIZE = 250;

const createContentPreview = (content) => String(content || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 240);

const isValidPost = (post) => {
  return (
    post &&
    typeof post.user_id === 'string' && post.user_id.trim() !== '' &&
    typeof post.nickname === 'string' && post.nickname.trim() !== '' &&
    typeof post.title === 'string' && post.title.trim() !== '' &&
    typeof post.created_at === 'string' && post.created_at.trim() !== ''
  );
};

const toSummary = (post) => ({
  user_id: post.user_id,
  nickname: post.nickname,
  title: post.title,
  content_preview: createContentPreview(post.content),
  tags: post.tags || [],
  view_count: Number(post.view_count || 0),
  created_at: post.created_at,
  updated_at: post.updated_at || post.created_at,
});

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const main = async () => {
  const db = getDatabase();
  const [postsSnapshot, summariesSnapshot] = await Promise.all([
    db.ref('boardPosts').get(),
    db.ref('boardPostSummaries').get(),
  ]);
  const currentSummaries = summariesSnapshot.val() || {};
  const updates = {};
  const failedRecords = [];

  postsSnapshot.forEach((child) => {
    const post = child.val() || {};
    if (!isValidPost(post)) {
      failedRecords.push({ id: child.key, reason: 'Missing required fields (user_id, nickname, title, created_at)' });
      return;
    }
    const summary = toSummary(post);
    if (!sameJson(currentSummaries[child.key], summary)) {
      updates[child.key] = {
        summary,
        initialUpdatedAt: post.updated_at || post.created_at,
      };
    }
  });

  if (failedRecords.length > 0) {
    console.warn(`Skipped ${failedRecords.length} invalid post(s):`);
    failedRecords.forEach(({ id, reason }) => console.warn(`- boardPosts/${id}: ${reason}`));
  }

  const entries = Object.entries(updates);
  console.log(`${commit ? 'Migrating' : 'Dry run:'} ${entries.length} board post summary record(s).`);
  entries.forEach(([key]) => console.log(`- boardPostSummaries/${key}`));

  if (!commit || !entries.length) return;

  let migratedCount = 0;
  for (let offset = 0; offset < entries.length; offset += BATCH_SIZE) {
    const batch = entries.slice(offset, offset + BATCH_SIZE);
    const batchUpdates = {};

    await Promise.all(
      batch.map(async ([key, { summary, initialUpdatedAt }]) => {
        const freshSnap = await db.ref(`boardPosts/${key}`).get();
        if (!freshSnap.exists()) {
          console.warn(`Skipped deleted post during migration: boardPosts/${key}`);
          return;
        }
        const freshPost = freshSnap.val() || {};
        const freshUpdatedAt = freshPost.updated_at || freshPost.created_at;
        if (freshUpdatedAt !== initialUpdatedAt) {
          console.warn(`Skipped post modified concurrently during migration: boardPosts/${key}`);
          return;
        }
        batchUpdates[`boardPostSummaries/${key}`] = summary;
      })
    );

    if (Object.keys(batchUpdates).length > 0) {
      await db.ref().update(batchUpdates);
      migratedCount += Object.keys(batchUpdates).length;
    }
  }
  console.log(`Migration completed: ${migratedCount} board post summary record(s) updated.`);
};

main().catch((error) => {
  console.error('Board post summary migration failed:', error);
  process.exitCode = 1;
});
