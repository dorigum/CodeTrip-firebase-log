const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
if (!projectId) {
  throw new Error('GOOGLE_CLOUD_PROJECT 환경 변수를 설정하세요.');
}

initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`,
});

const SOURCES = [
  { sourceRoot: 'boardPosts', targetRoot: 'boardPosts' },
  { sourceRoot: 'boardComments', targetRoot: 'boardComments' },
  { sourceRoot: 'travelComments', targetRoot: 'travelComments' },
];
const commit = process.argv.includes('--commit');

const toUidMap = (likeUserIds) => {
  if (Array.isArray(likeUserIds)) {
    const ids = likeUserIds.filter((id) => typeof id === 'string' && id);
    return Object.fromEntries(ids.map((id) => [id, true]));
  }

  if (!likeUserIds || typeof likeUserIds !== 'object') return null;

  const next = {};
  for (const [key, value] of Object.entries(likeUserIds)) {
    if (/^\d+$/.test(key) && typeof value === 'string' && value) {
      next[value] = true;
      continue;
    }

    if (value === true) {
      next[key] = true;
    }
  }

  return next;
};

const main = async () => {
  const db = getDatabase();
  const records = [];

  for (const { sourceRoot, targetRoot } of SOURCES) {
    const snapshot = await db.ref(sourceRoot).get();
    snapshot.forEach((child) => {
      const next = toUidMap(child.val()?.likeUserIds);
      if (next) {
        records.push({
          sourcePath: `${sourceRoot}/${child.key}/likeUserIds`,
          targetPath: `likes/${targetRoot}/${child.key}`,
          likes: next,
        });
      }
    });
  }

  console.log(`${commit ? 'Migrating' : 'Dry run:'} ${records.length} legacy likeUserIds record(s).`);
  records.forEach(({ sourcePath, targetPath }) => console.log(`- ${sourcePath} -> ${targetPath}`));

  if (commit && records.length) {
    let migratedCount = 0;
    for (const { sourcePath, targetPath, likes } of records) {
      const result = await db.ref(targetPath).transaction((current) => ({
        ...(toUidMap(current) || {}),
        ...likes,
        __migrated: true,
      }));
      if (result.committed) {
        await db.ref(sourcePath).remove();
        migratedCount += 1;
      }
    }
    console.log(`Migration completed: ${migratedCount} record(s) moved to likes/*.`);
  }
};

main().catch((error) => {
  console.error('Like-user ID migration failed:', error);
  process.exitCode = 1;
});
