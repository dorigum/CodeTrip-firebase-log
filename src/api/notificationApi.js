import { get, limitToLast, orderByChild, query, ref, remove, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, nowIso, snapshotToArray, toIso } from './firebaseHelpers';
import { toTourApiAreaCodeSet } from '../utils/tourApiAreaCode';

const TOUR_UPDATE_NOTIFICATION_PREFIX = 'tourapi-';
const TOUR_UPDATE_LIMIT = 10;
const NOTIFICATION_DISPLAY_LIMIT = 30;

const getFavoriteRegions = async (userId) => {
  const snapshot = await get(ref(realtimeDb, `users/${userId}/favoriteRegions`));
  return toTourApiAreaCodeSet(snapshot.exists() ? snapshot.val() : []);
};

const getMyNotifications = async (userId, { limit = NOTIFICATION_DISPLAY_LIMIT } = {}) => {
  const constraints = [orderByChild('created_at')];
  if (limit !== null) constraints.push(limitToLast(limit));

  return snapshotToArray(await get(query(ref(realtimeDb, `users/${userId}/notifications`), ...constraints)))
    .sort((a, b) => new Date(toIso(b.created_at)) - new Date(toIso(a.created_at)))
    .slice(0, limit || undefined);
};

const getTourApiUpdateNotifications = async (userId, favoriteRegions, { limit = TOUR_UPDATE_LIMIT } = {}) => {
  if (favoriteRegions.size === 0) return [];

  const [updatesSnapshot, readsSnapshot] = await Promise.all([
    get(ref(realtimeDb, 'tourApiUpdates/items')),
    get(ref(realtimeDb, `users/${userId}/tourApiUpdateReads`)),
  ]);
  const readMarkers = readsSnapshot.exists() ? readsSnapshot.val() || {} : {};

  return snapshotToArray(updatesSnapshot)
    .filter((item) => favoriteRegions.has(String(item.areaCode || '').trim()))
    .sort((a, b) => new Date(toIso(b.detectedAt)) - new Date(toIso(a.detectedAt)))
    .map((item) => {
      const marker = readMarkers[item.id] || {};
      const regionLabel = item.addr1 ? ` · ${item.addr1}` : '';
      const notificationType = String(item.contentTypeId) === '15' ? '신규 축제·행사' : '신규 여행지';

      return {
        id: `${TOUR_UPDATE_NOTIFICATION_PREFIX}${item.id}`,
        type: 'tourapi_new_destination',
        content_id: String(item.contentId || item.id),
        message: `[${notificationType}] ${item.title}${regionLabel}`,
        created_at: toIso(item.detectedAt),
        is_read: !!marker.is_read,
        hidden: !!marker.hidden,
      };
    })
    .filter((notification) => !notification.hidden)
    .slice(0, limit || undefined);
};

const isTourApiUpdateNotification = (id) =>
  String(id || '').startsWith(TOUR_UPDATE_NOTIFICATION_PREFIX);

const getTourApiUpdateId = (id) =>
  String(id || '').replace(TOUR_UPDATE_NOTIFICATION_PREFIX, '');

export const getNotifications = async () => {
  const user = await getCurrentUser();
  const [notifications, favoriteRegions] = await Promise.all([
    getMyNotifications(user.id),
    getFavoriteRegions(user.id),
  ]);
  const tourApiNotifications = await getTourApiUpdateNotifications(user.id, favoriteRegions, { limit: null });
  const mergedNotifications = [
    ...notifications.map((notification) => ({
      ...notification,
      created_at: toIso(notification.created_at),
      is_read: !!notification.is_read,
    })),
    ...tourApiNotifications,
  ].sort((a, b) => new Date(toIso(b.created_at)) - new Date(toIso(a.created_at)))
    .slice(0, 30);

  return {
    notifications: mergedNotifications,
    unreadCount: mergedNotifications.filter((notification) => !notification.is_read).length,
  };
};

export const markAllRead = async () => {
  const user = await getCurrentUser();
  const [notifications, favoriteRegions] = await Promise.all([
    getMyNotifications(user.id, { limit: null }),
    getFavoriteRegions(user.id),
  ]);
  const tourApiNotifications = await getTourApiUpdateNotifications(user.id, favoriteRegions, { limit: null });
  const updates = {};
  notifications
    .filter((notification) => !notification.is_read)
    .forEach((notification) => { updates[`users/${user.id}/notifications/${notification.id}/is_read`] = true; });
  tourApiNotifications
    .filter((notification) => !notification.is_read)
    .forEach((notification) => {
      updates[`users/${user.id}/tourApiUpdateReads/${getTourApiUpdateId(notification.id)}`] = {
        is_read: true,
        read_at: nowIso(),
      };
    });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};

export const markOneRead = async (id) => {
  const user = await getCurrentUser();
  if (isTourApiUpdateNotification(id)) {
    await update(ref(realtimeDb, `users/${user.id}/tourApiUpdateReads/${getTourApiUpdateId(id)}`), {
      is_read: true,
      read_at: nowIso(),
    });
    return;
  }

  await update(ref(realtimeDb, `users/${user.id}/notifications/${id}`), { is_read: true });
};

export const deleteOneNotification = async (id) => {
  const user = await getCurrentUser();
  if (isTourApiUpdateNotification(id)) {
    await update(ref(realtimeDb, `users/${user.id}/tourApiUpdateReads/${getTourApiUpdateId(id)}`), {
      is_read: true,
      hidden: true,
      hidden_at: nowIso(),
    });
    return;
  }

  await remove(ref(realtimeDb, `users/${user.id}/notifications/${id}`));
};

export const deleteReadNotifications = async () => {
  const user = await getCurrentUser();
  const [notifications, favoriteRegions] = await Promise.all([
    getMyNotifications(user.id, { limit: null }),
    getFavoriteRegions(user.id),
  ]);
  const tourApiNotifications = await getTourApiUpdateNotifications(user.id, favoriteRegions, { limit: null });
  const updates = {};
  notifications
    .filter((notification) => notification.is_read)
    .forEach((notification) => { updates[`users/${user.id}/notifications/${notification.id}`] = null; });
  tourApiNotifications
    .filter((notification) => notification.is_read)
    .forEach((notification) => {
      updates[`users/${user.id}/tourApiUpdateReads/${getTourApiUpdateId(notification.id)}`] = {
        is_read: true,
        hidden: true,
        hidden_at: nowIso(),
      };
    });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};
