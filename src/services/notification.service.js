import prisma from '../config/db.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { broadcastToUser } from './websocket.service.js';
import { sendPushToUser } from './push.service.js';

/** Persists a notification, then fans it out over the live WebSocket connection and FCM push. */
export const createNotification = async ({ userId, type, title, message, relatedProjectId, metadata }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, relatedProjectId, metadata },
  });

  broadcastToUser(userId, { event: 'notification', notification });
  await sendPushToUser(userId, { title, body: message, data: { type, relatedProjectId: relatedProjectId || '' } });

  return notification;
};

export const listMyNotifications = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { userId, ...(query.unreadOnly === 'true' ? { isRead: false } : {}) };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.notification.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};

export const markNotificationRead = async (userId, notificationId) =>
  prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

export const markAllNotificationsRead = async (userId) =>
  prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
