import { get, ref, remove, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, nowIso, snapshotToArray, toIso } from './firebaseHelpers';

const TOUR_UPDATE_NOTIFICATION_PREFIX = 'tourapi-';
const TOUR_UPDATE_LIMIT = 10;

const getMyNotifications = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, `users/${user.id}/notifications`)))
    .sort((a, b) => new Date(toIso(b.created_at)) - new Date(toIso(a.created_at)))
    .slice(0, 30);
};

const getTourApiUpdateNotifications = async (userId, { limit = TOUR_UPDATE_LIMIT } = {}) => {
  const [updatesSnapshot, readsSnapshot] = await Promise.all([
    get(ref(realtimeDb, 'tourApiUpdates/items')),
    get(ref(realtimeDb, `users/${userId}/tourApiUpdateReads`)),
  ]);
  const readMarkers = readsSnapshot.exists() ? readsSnapshot.val() || {} : {};

  return snapshotToArray(updatesSnapshot)
    .sort((a, b) => new Date(toIso(b.detectedAt)) - new Date(toIso(a.detectedAt)))
    .map((item) => {
      const marker = readMarkers[item.id] || {};
      const regionLabel = item.addr1 ? ` · ${item.addr1}` : '';

      return {
        id: `${TOUR_UPDATE_NOTIFICATION_PREFIX}${item.id}`,
        type: 'tourapi_new_destination',
        content_id: String(item.contentId || item.id),
        message: `[신규 여행지] ${item.title}${regionLabel}`,
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
  const [notifications, tourApiNotifications] = await Promise.all([
    getMyNotifications(),
    getTourApiUpdateNotifications(user.id, { limit: null }),
  ]);
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
  const [notifications, tourApiNotifications] = await Promise.all([
    getMyNotifications(),
    getTourApiUpdateNotifications(user.id, { limit: null }),
  ]);
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
  const [notifications, tourApiNotifications] = await Promise.all([
    getMyNotifications(),
    getTourApiUpdateNotifications(user.id),
  ]);
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
