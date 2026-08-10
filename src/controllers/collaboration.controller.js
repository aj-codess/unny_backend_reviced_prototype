import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as collaborationService from '../services/collaboration.service.js';

export const inviteCollaborator = asyncHandler(async (req, res) => {
  const collaboration = await collaborationService.inviteCollaborator(
    req.params.projectId,
    req.user.id,
    req.body.userId,
  );
  success(res, 201, 'Collaborator invited', collaboration);
});

export const respondToInvite = asyncHandler(async (req, res) => {
  const collaboration = await collaborationService.respondToInvite(
    req.params.collaborationId,
    req.user.id,
    req.body.status,
  );
  success(res, 200, 'Invitation response recorded', collaboration);
});

export const listCollaborators = asyncHandler(async (req, res) => {
  const collaborators = await collaborationService.listCollaborators(req.params.projectId);
  success(res, 200, 'Collaborators fetched', collaborators);
});

export const removeCollaborator = asyncHandler(async (req, res) => {
  await collaborationService.removeCollaborator(req.params.projectId, req.user.id, req.params.userId);
  success(res, 200, 'Collaborator removed');
});
