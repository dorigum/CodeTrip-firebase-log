import { get, ref, remove, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, snapshotToArray, toIso } from './firebaseHelpers';

const getMyNotifications = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, 'notifications')))
    .filter((notification) => notification.user_id === user.id)
    .sort((a, b) => new Date(toIso(b.created_at)) - new Date(toIso(a.created_at)))
    .slice(0, 30);
};

export const getNotifications = async () => {
  const notifications = await getMyNotifications();
  return {
    notifications: notifications.map((notification) => ({
      ...notification,
      created_at: toIso(notification.created_at),
      is_read: !!notification.is_read,
    })),
    unreadCount: notifications.filter((notification) => !notification.is_read).length,
  };
};

export const markAllRead = async () => {
  const notifications = await getMyNotifications();
  const updates = {};
  notifications
    .filter((notification) => !notification.is_read)
    .forEach((notification) => { updates[`notifications/${notification.id}/is_read`] = true; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};

export const markOneRead = async (id) => {
  await update(ref(realtimeDb, `notifications/${id}`), { is_read: true });
};

export const deleteOneNotification = async (id) => {
  await remove(ref(realtimeDb, `notifications/${id}`));
};

export const deleteReadNotifications = async () => {
  const notifications = await getMyNotifications();
  const updates = {};
  notifications
    .filter((notification) => notification.is_read)
    .forEach((notification) => { updates[`notifications/${notification.id}`] = null; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};
