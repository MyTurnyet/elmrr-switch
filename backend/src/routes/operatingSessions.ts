import express, { Router } from 'express';
import { getService } from '../services/index.js';
import { validateBody } from '../middleware/validation.js';
import { sessionSchemas } from '../schemas/sessionSchemas.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();
const sessionService = getService('session');

// GET /api/sessions/current - Get current session info
router.get('/current', asyncHandler(async (req, res) => {
  const currentSession = await sessionService.getCurrentSession();
  res.json(ApiResponse.success(currentSession, 'Current session retrieved successfully'));
}));

// POST /api/sessions/advance - Advance to next session
router.post('/advance', 
  validateBody(sessionSchemas.advance),
  asyncHandler(async (req, res) => {
  const result = await sessionService.advanceSession(req.body.description);
  res.json(ApiResponse.success(result.session, `Advanced to session ${result.stats.advancedToSession}`));
}));

// POST /api/sessions/rollback - Rollback to previous session
router.post('/rollback', 
  validateBody(sessionSchemas.rollback),
  asyncHandler(async (req, res) => {
  const result = await sessionService.rollbackSession(req.body.description);
  res.json(ApiResponse.success(result.session, `Rolled back to session ${result.stats.rolledBackToSession}`));
}));

// PUT /api/sessions/current - Update current session description
router.put('/current', 
  validateBody(sessionSchemas.update),
  asyncHandler(async (req, res) => {
  const updatedSession = await sessionService.updateSessionDescription(req.body.description);
  res.json(ApiResponse.success(updatedSession, 'Session description updated successfully'));
}));

export default router;
