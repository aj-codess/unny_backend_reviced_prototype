import prisma from '../config/db.js';
import { getFirebaseApp } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

/** Sends an FCM push to every registered device of a user. No-ops silently if Firebase isn't configured. */
export const sendPushToUser = async (userId, { title, body, data = {} }) => {
  const app = getFirebaseApp();
  if (!app) return;

  const devices = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
  if (!devices.length) return;

  try {
    await app.messaging().sendEachForMulticast({
      tokens: devices.map((d) => d.token),
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    logger.error('Push notification dispatch failed', err.message);
  }
};

export const registerDeviceToken = async (userId, token, platform) =>
  prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });

export const removeDeviceToken = async (token) =>
  prisma.deviceToken.deleteMany({ where: { token } });
