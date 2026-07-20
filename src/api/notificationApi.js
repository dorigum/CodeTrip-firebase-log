import { get, ref, remove, update } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { getCurrentUser, snapshotToArray, toIso } from './firebaseHelpers';

const getMyNotifications = async () => {
  const user = await getCurrentUser();
  return snapshotToArray(await get(ref(realtimeDb, `users/${user.id}/notifications`)))
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
  const user = await getCurrentUser();
  const notifications = await getMyNotifications();
  const updates = {};
  notifications
    .filter((notification) => !notification.is_read)
    .forEach((notification) => { updates[`users/${user.id}/notifications/${notification.id}/is_read`] = true; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};

export const markOneRead = async (id) => {
  const user = await getCurrentUser();
  await update(ref(realtimeDb, `users/${user.id}/notifications/${id}`), { is_read: true });
};

export const deleteOneNotification = async (id) => {
  const user = await getCurrentUser();
  await remove(ref(realtimeDb, `users/${user.id}/notifications/${id}`));
};

export const deleteReadNotifications = async () => {
  const user = await getCurrentUser();
  const notifications = await getMyNotifications();
  const updates = {};
  notifications
    .filter((notification) => notification.is_read)
    .forEach((notification) => { updates[`users/${user.id}/notifications/${notification.id}`] = null; });
  if (Object.keys(updates).length) await update(ref(realtimeDb), updates);
};
