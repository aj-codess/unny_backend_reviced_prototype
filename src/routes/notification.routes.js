import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authGuard);

router.get('/', notificationController.listMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.post('/devices', notificationController.registerDevice);
router.delete('/devices', notificationController.unregisterDevice);

export default router;
