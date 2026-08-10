import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as supervisionService from '../services/supervision.service.js';

export const requestSupervision = asyncHandler(async (req, res) => {
  const request = await supervisionService.requestSupervision(
    req.params.projectId,
    req.user.id,
    req.body.supervisorId,
    req.body.message,
  );
  success(res, 201, 'Supervision request sent', request);
});

export const respondToSupervisionRequest = asyncHandler(async (req, res) => {
  const request = await supervisionService.respondToSupervisionRequest(
    req.params.requestId,
    req.user.id,
    req.body.status,
  );
  success(res, 200, 'Supervision request response recorded', request);
});

export const listMySupervisionRequests = asyncHandler(async (req, res) => {
  const requests = await supervisionService.listMySupervisionRequests(req.user.id, req.user.role);
  success(res, 200, 'Supervision requests fetched', requests);
});
