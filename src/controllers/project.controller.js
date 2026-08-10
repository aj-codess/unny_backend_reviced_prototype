import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as projectService from '../services/project.service.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  success(res, 201, 'Project draft created', project);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user.id);
  success(res, 200, 'Project fetched', project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
  success(res, 200, 'Project updated', project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user.id);
  success(res, 200, 'Project deleted');
});

export const submitProject = asyncHandler(async (req, res) => {
  const project = await projectService.submitProject(req.params.id, req.user.id);
  success(res, 200, 'Project submitted for review', project);
});

export const exploreProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.exploreProjects(req.query);
  success(res, 200, 'Projects fetched', items, meta);
});

export const myProjects = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.myProjects(req.user.id, req.query);
  success(res, 200, 'Your projects fetched', items, meta);
});

export const myReviewQueue = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.myReviewQueue(req.user.id, req.query);
  success(res, 200, 'Review queue fetched', items, meta);
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await projectService.addComment(req.params.id, req.user.id, req.body.body);
  success(res, 201, 'Comment added', comment);
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const result = await projectService.toggleBookmark(req.params.id, req.user.id);
  success(res, 200, 'Bookmark updated', result);
});

export const myBookmarks = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.myBookmarks(req.user.id, req.query);
  success(res, 200, 'Bookmarks fetched', items, meta);
});
