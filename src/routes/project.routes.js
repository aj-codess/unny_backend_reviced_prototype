import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import collaborationRoutes from './collaboration.routes.js';
import supervisionRoutes from './supervision.routes.js';
import reviewRoutes from './review.routes.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  exploreProjectsValidator,
  addCommentValidator,
} from '../validators/project.validator.js';

const router = Router();

// Public archive browsing (no auth required to explore approved projects).
router.get('/explore', exploreProjectsValidator, validate, projectController.exploreProjects);

router.use(authGuard);

router.get('/mine', projectController.myProjects);
router.get('/review-queue', restrictTo('SUPERVISOR'), projectController.myReviewQueue);
router.get('/bookmarks', projectController.myBookmarks);

router.post('/', restrictTo('STUDENT'), createProjectValidator, validate, projectController.createProject);
router.get('/:id', projectIdValidator, validate, projectController.getProject);
router.patch('/:id', updateProjectValidator, validate, projectController.updateProject);
router.delete('/:id', projectIdValidator, validate, projectController.deleteProject);
router.post('/:id/submit', projectIdValidator, validate, projectController.submitProject);
router.post('/:id/comments', addCommentValidator, validate, projectController.addComment);
router.post('/:id/bookmark', projectIdValidator, validate, projectController.toggleBookmark);

// Nested resource routers (collaboration, supervision requests, reviews)
router.use('/:projectId/collaborators', collaborationRoutes);
router.use('/:projectId/supervision-requests', supervisionRoutes);
router.use('/:projectId/reviews', reviewRoutes);

export default router;
