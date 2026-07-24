import { get, push, ref, remove, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, nowIso, snapshotToArray, toIso } from './firebaseHelpers';
import { getDetailCommon } from './travelInfoApi';

const userPath = (uid, child) => `users/${uid}/${child}`;

const toText = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    return value.text || value.content || value.title || value.label || fallback;
  }
  return fallback;
};

const compactObject = (value) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => entry !== undefined)
);

const getTourContentId = (item = {}) => {
  const contentId = item.contentId ?? item.contentid ?? item.content_id;
  return contentId == null ? '' : String(contentId).trim();
};

const REGION_MATCHERS = [
  { key: '서울', aliases: ['서울', '서울특별시'] },
  { key: '부산', aliases: ['부산', '부산광역시'] },
  { key: '대구', aliases: ['대구', '대구광역시'] },
  { key: '인천', aliases: ['인천', '인천광역시'] },
  { key: '광주', aliases: ['광주', '광주광역시'] },
  { key: '대전', aliases: ['대전', '대전광역시'] },
  { key: '울산', aliases: ['울산', '울산광역시'] },
  { key: '세종', aliases: ['세종', '세종특별자치시'] },
  { key: '경기', aliases: ['경기', '경기도'] },
  { key: '강원', aliases: ['강원', '강원도', '강원특별자치도'] },
  { key: '충북', aliases: ['충북', '충청북도'] },
  { key: '충남', aliases: ['충남', '충청남도'] },
  { key: '전북', aliases: ['전북', '전라북도', '전북특별자치도'] },
  { key: '전남', aliases: ['전남', '전라남도'] },
  { key: '경북', aliases: ['경북', '경상북도'] },
  { key: '경남', aliases: ['경남', '경상남도'] },
  { key: '제주', aliases: ['제주', '제주도', '제주특별자치도'] },
];

const getRegionKey = (value) => {
  const text = toText(value);
  if (!text) return '';

  return REGION_MATCHERS.find(({ aliases }) => aliases.some((alias) => text.includes(alias)))?.key || '';
};

const matchesExpectedRegion = (address, expectedRegion) => {
  const expectedKey = getRegionKey(expectedRegion);
  if (!expectedKey) return true;
  return getRegionKey(address) === expectedKey;
};

const verifyTourPlace = async (item, expectedRegion = '') => {
  const contentId = getTourContentId(item);
  if (!contentId) return null;

  try {
    const detail = await getDetailCommon(contentId);
    const verifiedContentId = String(detail?.contentid ?? detail?.contentId ?? '').trim();
    const title = toText(detail?.title);

    if (!detail || verifiedContentId !== contentId || !title) return null;

    const addr1 = toText(
      [detail.addr1, detail.addr2].map((value) => toText(value)).filter(Boolean).join(' '),
      '정보 없음'
    );

    if (!matchesExpectedRegion(addr1, expectedRegion)) return null;

    return {
      contentId,
      title,
      imageUrl: toText(detail.firstimage || detail.firstimage2),
      addr1,
      contentTypeId: toText(detail.contenttypeid || detail.contentTypeId),
    };
  } catch (error) {
    console.warn(`TourAPI contentId verification failed: ${contentId}`, error);
    return null;
  }
};

const normalizePlanItemSource = (item, verifiedPlace) => {
  const contentId = getTourContentId(item);

  if (verifiedPlace) {
    return compactObject({
      ...item,
      placeName: verifiedPlace.title,
      title: verifiedPlace.title,
      contentId: verifiedPlace.contentId,
      contentid: verifiedPlace.contentId,
      address: verifiedPlace.addr1,
      addr1: verifiedPlace.addr1,
      firstimage: verifiedPlace.imageUrl,
      imageUrl: verifiedPlace.imageUrl,
      contentTypeId: verifiedPlace.contentTypeId,
      source: 'tour_api',
      tourApiVerified: true,
    });
  }

  const {
    contentId: ignoredContentId,
    contentid: ignoredContentid,
    content_id: ignoredContentIdSnake,
    ...itemWithoutContentId
  } = item;
  void ignoredContentId;
  void ignoredContentid;
  void ignoredContentIdSnake;

  return compactObject({
    ...itemWithoutContentId,
    aiSuggestedContentId: contentId || undefined,
    source: 'ai_generated',
    tourApiVerified: false,
  });
};

const LEGACY_AI_COURSE_PREFIX = '[AI 여행 코스]';

const isLegacyAiCourseNote = (note) => (
  (note?.type || 'CHECKLIST') === 'MEMO'
  && String(note?.content || '').trim().startsWith(LEGACY_AI_COURSE_PREFIX)
);

export const getWishlistDetails = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlists'))))
    .map((item) => {
      const contentId = getTourContentId(item);

      return {
        id: item.id,
        contentid: contentId,
        contentId,
        title: item.title || '여행지',
        firstimage: item.imageUrl || item.firstimage || '',
        folder_id: item.folder_id || null,
        addr1: item.addr1 || item.address || '정보 없음',
        source: item.source || null,
        tourApiVerified: !!item.tourApiVerified,
        aiSuggestedContentId: item.aiSuggestedContentId || null,
        verified_at: item.verified_at || null,
        created_at: toIso(item.created_at),
      };
    })
    .filter((item) => item.contentId);
};

export const toggleWishlist = async (contentId, title, imageUrl, folderId = null, addr1 = '') => {
  const user = await getCurrentUser();
  const wishlistRoot = ref(realtimeDb, userPath(user.id, 'wishlists'));
  const wishlists = snapshotToArray(await get(wishlistRoot));
  const existing = wishlists.find((item) => getTourContentId(item) === String(contentId));

  if (existing) {
    await remove(ref(realtimeDb, userPath(user.id, `wishlists/${existing.id}`)));
    return { success: true, wishlisted: false, id: existing.id };
  }

  const wishlistRef = push(wishlistRoot);
  await update(ref(realtimeDb), {
    [userPath(user.id, `wishlists/${wishlistRef.key}`)]: {
      user_id: user.id,
      contentId: String(contentId),
      title,
      imageUrl: imageUrl || '',
      folder_id: folderId || null,
      addr1: addr1 || '정보 없음',
      created_at: nowIso(),
    }
  });
  return { success: true, wishlisted: true, id: wishlistRef.key };
};

export const removeWishlistItem = async (wishlistItemId) => {
  const user = await getCurrentUser();
  const targetWishlistItemId = String(wishlistItemId || '').trim();
  if (!targetWishlistItemId) return { removedCount: 0 };

  const targetRef = ref(realtimeDb, userPath(user.id, `wishlists/${targetWishlistItemId}`));
  const snapshot = await get(targetRef);
  if (!snapshot.exists()) return { removedCount: 0 };

  await remove(targetRef);

  return { removedCount: 1 };
};

export const addWishlistToFolder = async (itemData = {}, folderId = null) => {
  const user = await getCurrentUser();
  const contentId = itemData.contentid ?? itemData.contentId ?? itemData.content_id;
  if (!contentId) return null;

  const wishlistRoot = ref(realtimeDb, userPath(user.id, 'wishlists'));
  const wishlists = snapshotToArray(await get(wishlistRoot));
  const existing = wishlists.find((item) => getTourContentId(item) === String(contentId));
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
  const [wishlists, notes, aiTripPlans] = await Promise.all([
    get(ref(realtimeDb, userPath(user.id, 'wishlists'))),
    get(ref(realtimeDb, userPath(user.id, 'wishlistNotes'))),
    get(ref(realtimeDb, userPath(user.id, 'aiTripPlans'))),
  ]);
  const updates = { [userPath(user.id, `wishlistFolders/${folderId}`)]: null };

  snapshotToArray(wishlists)
    .filter((item) => item.folder_id === String(folderId))
    .forEach((item) => { updates[userPath(user.id, `wishlists/${item.id}/folder_id`)] = null; });

  snapshotToArray(notes)
    .filter((note) => note.folder_id === String(folderId))
    .forEach((note) => { updates[userPath(user.id, `wishlistNotes/${note.id}`)] = null; });

  snapshotToArray(aiTripPlans)
    .filter((plan) => plan.folder_id === String(folderId))
    .forEach((plan) => { updates[userPath(user.id, `aiTripPlans/${plan.id}`)] = null; });

  await update(ref(realtimeDb), updates);
  return { success: true };
};

export const moveItem = async (contentId, folderId) => {
  const user = await getCurrentUser();
  const wishlists = snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'wishlists'))));
  const updates = {};
  wishlists
    .filter((item) => getTourContentId(item) === String(contentId))
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

export const getAiTripPlans = async (folderId) => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, userPath(user.id, 'aiTripPlans'))))
    .filter((plan) => plan.folder_id === String(folderId))
    .map((plan) => ({
      ...plan,
      created_at: toIso(plan.created_at),
      days: Array.isArray(plan.days) ? plan.days : [],
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const updateAiTripPlan = async (planId, values = {}) => {
  const user = await getCurrentUser();
  const updates = compactObject({
    title: values.title != null ? toText(values.title, 'AI 여행 코스') : undefined,
    summary: values.summary != null ? toText(values.summary) : undefined,
    updated_at: nowIso(),
  });
  await update(ref(realtimeDb, userPath(user.id, `aiTripPlans/${planId}`)), updates);
  return { id: String(planId), ...updates };
};

export const deleteAiTripPlan = async (planId) => {
  const user = await getCurrentUser();
  await remove(ref(realtimeDb, userPath(user.id, `aiTripPlans/${planId}`)));
  return { success: true };
};

export const migrateLegacyAiCourseNotes = async (folderId, noteIds = []) => {
  const user = await getCurrentUser();
  const normalizedFolderId = String(folderId);
  const selectedNoteIds = new Set(noteIds.map(String));
  const [notesSnapshot, folderSnapshot] = await Promise.all([
    get(ref(realtimeDb, userPath(user.id, 'wishlistNotes'))),
    get(ref(realtimeDb, userPath(user.id, `wishlistFolders/${normalizedFolderId}`))),
  ]);
  const folderName = folderSnapshot.exists() ? toText(folderSnapshot.val()?.name, '여행 코스') : '여행 코스';
  const legacyNotes = snapshotToArray(notesSnapshot).filter((note) => (
    String(note.folder_id) === normalizedFolderId
    && isLegacyAiCourseNote(note)
    && (selectedNoteIds.size === 0 || selectedNoteIds.has(String(note.id)))
  ));

  if (legacyNotes.length === 0) return { migratedCount: 0 };

  const migratedAt = nowIso();
  const updates = {};

  legacyNotes.forEach((note, index) => {
    const originalContent = toText(note.content);
    const courseContent = originalContent.slice(LEGACY_AI_COURSE_PREFIX.length).trim();
    const planRef = push(ref(realtimeDb, userPath(user.id, 'aiTripPlans')));

    updates[userPath(user.id, `aiTripPlans/${planRef.key}`)] = {
      folder_id: normalizedFolderId,
      user_id: user.id,
      title: legacyNotes.length > 1 ? `${folderName} AI 여행 코스 ${index + 1}` : `${folderName} AI 여행 코스`,
      summary: courseContent.slice(0, 240),
      days: [],
      legacy_content: courseContent,
      source: 'legacy_wishlist_note',
      migrated_from_note_id: String(note.id),
      created_at: toIso(note.created_at || migratedAt),
      migrated_at: migratedAt,
    };
    updates[userPath(user.id, `wishlistNotes/${note.id}`)] = null;
  });

  updates[userPath(user.id, `wishlistFolders/${normalizedFolderId}/updated_at`)] = migratedAt;
  await update(ref(realtimeDb), updates);

  return { migratedCount: legacyNotes.length };
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

export const saveAiTripToFolder = async (plan, options = {}) => {
  const user = await getCurrentUser();
  const created_at = nowIso();
  const folderName = toText(plan?.saveGuide?.folderName || plan?.title, 'AI 여행 코스');
  const generationContext = plan?.generationContext || plan?.generation_context || {};
  const expectedRegion = toText(generationContext.regionName || plan?.regionName);
  const targetFolderId = options.folderId ? String(options.folderId) : null;
  const folderRef = targetFolderId
    ? ref(realtimeDb, userPath(user.id, `wishlistFolders/${targetFolderId}`))
    : push(ref(realtimeDb, userPath(user.id, 'wishlistFolders')));
  const existingFolderSnapshot = targetFolderId ? await get(folderRef) : null;
  const existingFolder = existingFolderSnapshot?.exists() ? existingFolderSnapshot.val() : null;
  const folder = {
    id: targetFolderId || folderRef.key,
    user_id: user.id,
    name: existingFolder?.name || folderName,
    start_date: existingFolder?.start_date || null,
    end_date: existingFolder?.end_date || null,
    created_at: toIso(existingFolder?.created_at || created_at),
    updated_at: created_at,
  };
  const originalDays = Array.isArray(plan?.days) ? plan.days : [];
  const originalItems = originalDays.flatMap((day) =>
    (Array.isArray(day.items) ? day.items : []).map((item) => ({ ...item, day: day.day }))
  );
  const uniqueContentItems = Array.from(
    new Map(
      originalItems
        .filter((item) => getTourContentId(item))
        .map((item) => [getTourContentId(item), item])
    ).values()
  );
  const verificationResults = await Promise.all(
    uniqueContentItems.map(async (item) => [getTourContentId(item), await verifyTourPlace(item, expectedRegion)])
  );
  const verifiedPlaceMap = new Map(
    verificationResults.filter(([, verifiedPlace]) => verifiedPlace)
  );
  const days = originalDays.map((day) => ({
    ...day,
    items: (Array.isArray(day.items) ? day.items : []).map((item) => (
      normalizePlanItemSource(item, verifiedPlaceMap.get(getTourContentId(item)))
    )),
  }));
  const allItems = days.flatMap((day) =>
    (Array.isArray(day.items) ? day.items : []).map((item) => ({ ...item, day: day.day }))
  );
  const verifiedPlaces = Array.from(verifiedPlaceMap.values());
  const verifiedItemCount = allItems.filter((item) => item.tourApiVerified).length;
  const documentOnlyPlaces = allItems.length - verifiedItemCount;
  const rejectedContentIds = verificationResults.filter(([, verifiedPlace]) => !verifiedPlace).length;

  const updates = {};

  if (targetFolderId) {
    updates[userPath(user.id, `wishlistFolders/${folder.id}/updated_at`)] = created_at;
  } else {
    updates[userPath(user.id, `wishlistFolders/${folder.id}`)] = {
      user_id: folder.user_id,
      name: folder.name,
      start_date: folder.start_date,
      end_date: folder.end_date,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
    };
  }

  const planRef = push(ref(realtimeDb, userPath(user.id, 'aiTripPlans')));
  updates[userPath(user.id, `aiTripPlans/${planRef.key}`)] = {
    folder_id: String(folder.id),
    user_id: user.id,
    title: toText(plan?.title, folderName),
    summary: toText(plan?.summary),
    saveGuide: plan?.saveGuide || null,
    generation_context: generationContext || null,
    tour_api_verification: {
      verified_places: verifiedPlaces.length,
      document_only_places: documentOnlyPlaces,
      rejected_content_ids: rejectedContentIds,
      verified_at: created_at,
    },
    days,
    created_at,
  };

  const checklist = Array.isArray(plan?.saveGuide?.checklist)
    ? plan.saveGuide.checklist.map((item) => toText(item)).filter(Boolean)
    : [];
  checklist.forEach((item) => {
    const noteRef = push(ref(realtimeDb, userPath(user.id, 'wishlistNotes')));
    updates[userPath(user.id, `wishlistNotes/${noteRef.key}`)] = {
      folder_id: String(folder.id),
      user_id: user.id,
      content: item,
      type: 'CHECKLIST',
      is_completed: false,
      created_at,
    };
  });

  const wishlistRoot = ref(realtimeDb, userPath(user.id, 'wishlists'));
  const wishlists = snapshotToArray(await get(wishlistRoot));
  verifiedPlaces.forEach((place) => {
    const contentId = place.contentId;
    const existing = wishlists.find((wishlist) => (
      getTourContentId(wishlist) === contentId
      && String(wishlist.folder_id || '') === String(folder.id)
    ));
    const wishlistId = existing?.id || push(wishlistRoot).key;
    updates[userPath(user.id, `wishlists/${wishlistId}`)] = compactObject({
      user_id: user.id,
      contentId,
      title: place.title,
      imageUrl: place.imageUrl,
      folder_id: folder.id,
      addr1: place.addr1,
      source: 'tour_api',
      verified_at: created_at,
      created_at: existing?.created_at || created_at,
    });
  });

  await update(ref(realtimeDb), updates);

  return {
    folder,
    planId: planRef.key,
    savedPlaces: verifiedPlaces.length,
    documentOnlyPlaces,
    rejectedContentIds,
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
