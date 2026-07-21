import { get, push, ref, remove, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, nowIso, snapshotToArray, toIso } from './firebaseHelpers';

const userPath = (uid, child) => `users/${uid}/${child}`;

export const getWishlistDetails = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlists'))))
    .map((item) => ({
      contentid: String(item.contentId),
      contentId: String(item.contentId),
      title: item.title || '여행지',
      firstimage: item.imageUrl || '',
      folder_id: item.folder_id || null,
      addr1: item.addr1 || '정보 없음',
    }));
};

export const toggleWishlist = async (contentId, title, imageUrl, folderId = null) => {
  const user = await getCurrentUser();
  const wishlistRoot = ref(realtimeDb, userPath(user.id, 'wishlists'));
  const wishlists = snapshotToArray(await get(wishlistRoot));
  const existing = wishlists.find((item) => item.contentId === String(contentId));

  if (existing) {
    await remove(ref(realtimeDb, userPath(user.id, `wishlists/${existing.id}`)));
    return { wishlisted: false };
  }

  const wishlistRef = push(wishlistRoot);
  await update(ref(realtimeDb), {
    [userPath(user.id, `wishlists/${wishlistRef.key}`)]: {
      user_id: user.id,
      contentId: String(contentId),
      title,
      imageUrl: imageUrl || '',
      folder_id: folderId || null,
      created_at: nowIso(),
    }
  });
  return { wishlisted: true };
};

export const addWishlistToFolder = async (itemData = {}, folderId = null) => {
  const user = await getCurrentUser();
  const contentId = itemData.contentid ?? itemData.contentId ?? itemData.content_id;
  if (!contentId) return null;

  const wishlistRoot = ref(realtimeDb, userPath(user.id, 'wishlists'));
  const wishlists = snapshotToArray(await get(wishlistRoot));
  const existing = wishlists.find((item) => item.contentId === String(contentId));
  const payload = {
    user_id: user.id,
    contentId: String(contentId),
    title: itemData.title || itemData.placeName || '여행지',
    imageUrl: itemData.firstimage || itemData.imageUrl || '',
    folder_id: folderId || null,
    addr1: itemData.addr1 || itemData.address || '정보 없음',
    created_at: existing?.created_at || nowIso(),
  };

  if (existing) {
    await update(ref(realtimeDb, userPath(user.id, `wishlists/${existing.id}`)), payload);
    return { id: existing.id, ...payload };
  }

  const wishlistRef = push(wishlistRoot);
  await set(wishlistRef, payload);
  return { id: wishlistRef.key, ...payload };
};

export const getFolders = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlistFolders'))))
    .map((folder) => ({
      ...folder,
      start_date: folder.start_date || null,
      end_date: folder.end_date || null,
      created_at: toIso(folder.created_at),
      updated_at: toIso(folder.updated_at || folder.created_at),
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

export const createFolder = async (name, startDate, endDate) => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const folderRef = push(ref(realtimeDb, userPath(user.id, 'wishlistFolders')));
  await set(folderRef, {
    user_id: user.id,
    name,
    start_date: startDate || null,
    end_date: endDate || null,
    created_at,
    updated_at: created_at,
  });
  return {
    id: folderRef.key,
    name,
    start_date: startDate || null,
    end_date: endDate || null,
    created_at,
    updated_at: created_at,
  };
};

export const updateFolder = async (folderId, name, startDate, endDate) => {
  const user = await getCurrentUser();
  await update(ref(realtimeDb, userPath(user.id, `wishlistFolders/${folderId}`)), {
    name,
    start_date: startDate || null,
    end_date: endDate || null,
    updated_at: nowIso(),
  });
  return { id: folderId, name, start_date: startDate || null, end_date: endDate || null };
};

export const deleteFolder = async (folderId) => {
  const user = await getCurrentUser();
  const [wishlists, notes] = await Promise.all([
    get(ref(realtimeDb, userPath(user.id, 'wishlists'))),
    get(ref(realtimeDb, userPath(user.id, 'wishlistNotes'))),
  ]);
  const updates = { [userPath(user.id, `wishlistFolders/${folderId}`)]: null };

  snapshotToArray(wishlists)
    .filter((item) => item.folder_id === String(folderId))
    .forEach((item) => { updates[userPath(user.id, `wishlists/${item.id}/folder_id`)] = null; });

  snapshotToArray(notes)
    .filter((note) => note.folder_id === String(folderId))
    .forEach((note) => { updates[userPath(user.id, `wishlistNotes/${note.id}`)] = null; });

  await update(ref(realtimeDb), updates);
  return { success: true };
};

export const moveItem = async (contentId, folderId) => {
  const user = await getCurrentUser();
  const wishlists = snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlists'))));
  const updates = {};
  wishlists
    .filter((item) => item.contentId === String(contentId))
    .forEach((item) => { updates[userPath(user.id, `wishlists/${item.id}/folder_id`)] = folderId || null; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
  return { success: true };
};

export const getFolderNotes = async (folderId) => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlistNotes'))))
    .filter((note) => note.folder_id === String(folderId))
    .map((note) => ({ ...note, created_at: toIso(note.created_at), is_completed: !!note.is_completed }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

export const createNote = async (folderId, content, type = 'CHECKLIST') => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const noteRef = push(ref(realtimeDb, userPath(user.id, 'wishlistNotes')));
  const note = {
    folder_id: String(folderId),
    user_id: user.id,
    content,
    type,
    is_completed: false,
    created_at,
  };
  await set(noteRef, note);
  return { id: noteRef.key, ...note };
};

export const saveAiTripToFolder = async (plan) => {
  const folderName = plan?.saveGuide?.folderName || plan?.title || 'AI 여행 코스';
  const folder = await createFolder(folderName, null, null);
  const days = Array.isArray(plan?.days) ? plan.days : [];
  const allItems = days.flatMap((day) =>
    (Array.isArray(day.items) ? day.items : []).map((item) => ({ ...item, day: day.day }))
  );

  const memoLines = [
    `[AI 여행 코스] ${plan?.title || folderName}`,
    plan?.summary || '',
    plan?.saveGuide?.memo || '',
    '',
    ...days.map((day) => {
      const items = Array.isArray(day.items) ? day.items : [];
      const itemText = items
        .map((item) => `${item.time || ''} ${item.placeName || item.title || '장소'} - ${item.reason || ''}`.trim())
        .join('\n');
      return `Day ${day.day || ''} ${day.theme || ''}\n${itemText}`.trim();
    }),
  ].filter(Boolean);

  await createNote(folder.id, memoLines.join('\n\n'), 'MEMO');

  const checklist = Array.isArray(plan?.saveGuide?.checklist) ? plan.saveGuide.checklist : [];
  await Promise.all(checklist.filter(Boolean).map((item) => createNote(folder.id, item, 'CHECKLIST')));

  const contentItems = allItems.filter((item) => item.contentId || item.contentid);
  await Promise.all(contentItems.map((item) => addWishlistToFolder({
    contentId: item.contentId || item.contentid,
    title: item.placeName || item.title,
    address: item.address,
    firstimage: item.firstimage,
  }, folder.id)));

  return {
    folder,
    savedPlaces: contentItems.length,
    savedChecklist: checklist.length,
  };
};

export const toggleNote = async (noteId) => {
  const user = await getCurrentUser();
  const noteRef = ref(realtimeDb, userPath(user.id, `wishlistNotes/${noteId}`));
  const snap = await get(noteRef);
  if (!snap.exists()) return { success: true };
  await update(noteRef, { is_completed: !snap.val().is_completed });
  return { success: true };
};

export const deleteNote = async (noteId) => {
  const user = await getCurrentUser();
  await remove(ref(realtimeDb, userPath(user.id, `wishlistNotes/${noteId}`)));
  return { success: true };
};
