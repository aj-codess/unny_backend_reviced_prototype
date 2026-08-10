import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';
import * as pushService from '../services/push.service.js';

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.listMyNotifications(req.user.id, req.query);
  success(res, 200, 'Notifications fetched', items, meta);
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markNotificationRead(req.user.id, req.params.id);
  success(res, 200, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user.id);
  success(res, 200, 'All notifications marked as read');
});

export const registerDevice = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  await pushService.registerDeviceToken(req.user.id, token, platform);
  success(res, 201, 'Device registered for push notifications');
});

export const unregisterDevice = asyncHandler(async (req, res) => {
  await pushService.removeDeviceToken(req.body.token);
  success(res, 200, 'Device unregistered');
});
