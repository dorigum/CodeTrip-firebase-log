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

const toSummary = (post) => ({
  user_id: post.user_id || '',
  nickname: post.nickname || '익명',
  title: post.title || '',
  content_preview: createContentPreview(post.content),
  tags: post.tags || [],
  view_count: Number(post.view_count || 0),
  created_at: post.created_at || new Date(0).toISOString(),
  updated_at: post.updated_at || post.created_at || new Date(0).toISOString(),
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

  postsSnapshot.forEach((child) => {
    const summary = toSummary(child.val() || {});
    if (!sameJson(currentSummaries[child.key], summary)) {
      updates[`boardPostSummaries/${child.key}`] = summary;
    }
  });

  const entries = Object.entries(updates);
  console.log(`${commit ? 'Migrating' : 'Dry run:'} ${entries.length} board post summary record(s).`);
  entries.forEach(([path]) => console.log(`- ${path}`));

  if (!commit || !entries.length) return;

  for (let offset = 0; offset < entries.length; offset += BATCH_SIZE) {
    await db.ref().update(Object.fromEntries(entries.slice(offset, offset + BATCH_SIZE)));
  }
  console.log(`Migration completed: ${entries.length} board post summary record(s) updated.`);
};

main().catch((error) => {
  console.error('Board post summary migration failed:', error);
  process.exitCode = 1;
});
