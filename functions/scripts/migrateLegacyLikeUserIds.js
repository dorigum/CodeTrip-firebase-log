const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

initializeApp();

const ROOTS = ['boardPosts', 'boardComments', 'travelComments'];
const commit = process.argv.includes('--commit');

const toUidMap = (likeUserIds) => {
  if (Array.isArray(likeUserIds)) {
    const ids = likeUserIds.filter((id) => typeof id === 'string' && id);
    return ids.length ? Object.fromEntries(ids.map((id) => [id, true])) : {};
  }

  if (!likeUserIds || typeof likeUserIds !== 'object') return null;

  const next = {};
  let migrated = false;
  for (const [key, value] of Object.entries(likeUserIds)) {
    if (/^\d+$/.test(key) && typeof value === 'string' && value) {
      next[value] = true;
      migrated = true;
      continue;
    }

    if (value === true) {
      next[key] = true;
      continue;
    }

    return null;
  }

  return migrated ? next : null;
};

const main = async () => {
  const db = getDatabase();
  const paths = [];

  for (const root of ROOTS) {
    const snapshot = await db.ref(root).get();
    snapshot.forEach((child) => {
      const next = toUidMap(child.val()?.likeUserIds);
      if (next) paths.push(`${root}/${child.key}/likeUserIds`);
    });
  }

  console.log(`${commit ? 'Migrating' : 'Dry run:'} ${paths.length} legacy likeUserIds record(s).`);
  paths.forEach((path) => console.log(`- ${path}`));

  if (commit && paths.length) {
    let migratedCount = 0;
    for (const path of paths) {
      const result = await db.ref(path).transaction((current) => toUidMap(current) ?? undefined);
      if (result.committed) migratedCount += 1;
    }
    console.log(`Migration completed: ${migratedCount} record(s) converted.`);
  }
};

main().catch((error) => {
  console.error('Like-user ID migration failed:', error);
  process.exitCode = 1;
});
