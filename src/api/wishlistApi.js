import { get, push, ref, remove, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, nowIso, snapshotToArray, toIso } from './firebaseHelpers';

export const getWishlistDetails = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, 'wishlists')))
    .filter((item) => item.user_id === user.id)
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
  const wishlists = snapshotToArray(await get(ref(realtimeDb, 'wishlists')));
  const existing = wishlists.find((item) => item.user_id === user.id && item.contentId === String(contentId));

  if (existing) {
    await remove(ref(realtimeDb, `wishlists/${existing.id}`));
    return { wishlisted: false };
  }

  await set(push(ref(realtimeDb, 'wishlists')), {
    user_id: user.id,
    contentId: String(contentId),
    title,
    imageUrl: imageUrl || '',
    folder_id: folderId || null,
    created_at: nowIso(),
  });
  return { wishlisted: true };
};

export const getFolders = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, 'wishlistFolders')))
    .filter((folder) => folder.user_id === user.id)
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
  const folderRef = push(ref(realtimeDb, 'wishlistFolders'));
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
  await update(ref(realtimeDb, `wishlistFolders/${folderId}`), {
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
    get(ref(realtimeDb, 'wishlists')),
    get(ref(realtimeDb, 'wishlistNotes')),
  ]);
  const updates = { [`wishlistFolders/${folderId}`]: null };

  snapshotToArray(wishlists)
    .filter((item) => item.user_id === user.id && item.folder_id === String(folderId))
    .forEach((item) => { updates[`wishlists/${item.id}/folder_id`] = null; });

  snapshotToArray(notes)
    .filter((note) => note.user_id === user.id && note.folder_id === String(folderId))
    .forEach((note) => { updates[`wishlistNotes/${note.id}`] = null; });

  await update(ref(realtimeDb), updates);
  return { success: true };
};

export const moveItem = async (contentId, folderId) => {
  const user = await getCurrentUser();
  const wishlists = snapshotToArray(await get(ref(realtimeDb, 'wishlists')));
  const updates = {};
  wishlists
    .filter((item) => item.user_id === user.id && item.contentId === String(contentId))
    .forEach((item) => { updates[`wishlists/${item.id}/folder_id`] = folderId || null; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
  return { success: true };
};

export const getFolderNotes = async (folderId) => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, 'wishlistNotes')))
    .filter((note) => note.user_id === user.id && note.folder_id === String(folderId))
    .map((note) => ({ ...note, created_at: toIso(note.created_at), is_completed: !!note.is_completed }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

export const createNote = async (folderId, content, type = 'CHECKLIST') => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const noteRef = push(ref(realtimeDb, 'wishlistNotes'));
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

export const toggleNote = async (noteId) => {
  const noteRef = ref(realtimeDb, `wishlistNotes/${noteId}`);
  const snap = await get(noteRef);
  if (!snap.exists()) return { success: true };
  await update(noteRef, { is_completed: !snap.val().is_completed });
  return { success: true };
};

export const deleteNote = async (noteId) => {
  await remove(ref(realtimeDb, `wishlistNotes/${noteId}`));
  return { success: true };
};
