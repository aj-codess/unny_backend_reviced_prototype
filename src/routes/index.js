import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import projectRoutes from './project.routes.js';
import collaborationInviteRoutes from './collaboration-invites.routes.js';
import supervisionRequestRoutes from './supervision-requests.routes.js';
import tagRoutes from './tag.routes.js';
import notificationRoutes from './notification.routes.js';
import uploadRoutes from './upload.routes.js';
import exploreRoutes from './explore.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/collaboration-invites', collaborationInviteRoutes);
router.use('/supervision-requests', supervisionRequestRoutes);
router.use('/tags', tagRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
router.use('/explore', exploreRoutes);

export default router;
