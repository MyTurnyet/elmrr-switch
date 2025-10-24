import express from 'express';
import { getService } from '../services/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();
const sessionService = getService('session');

// GET /api/sessions/current - Get current session info
router.get('/current', asyncHandler(async (req, res) => {
  const currentSession = await sessionService.getCurrentSession();
  res.json(ApiResponse.success(currentSession, 'Current session retrieved successfully'));
}));

// POST /api/sessions/advance - Advance to next session
router.post('/advance', asyncHandler(async (req, res) => {
  const result = await sessionService.advanceSession(req.body.description);
  res.json(ApiResponse.success(result.session, `Advanced to session ${result.stats.advancedToSession}`));
}));

// POST /api/sessions/rollback - Rollback to previous session
router.post('/rollback', asyncHandler(async (req, res) => {
  const result = await sessionService.rollbackSession(req.body.description);
  res.json(ApiResponse.success(result.session, `Rolled back to session ${result.stats.rolledBackToSession}`));
}));

// PUT /api/sessions/current - Update current session description
router.put('/current', asyncHandler(async (req, res) => {
  const updatedSession = await sessionService.updateSessionDescription(req.body.description);
  res.json(ApiResponse.success(updatedSession, 'Session description updated successfully'));
}));

export default router;
