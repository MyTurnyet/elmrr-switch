import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const tracks = await dbHelpers.findAll('tracks');
  res.json(ApiResponse.success(tracks, 'Tracks retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const track = await dbHelpers.findById('tracks', req.params.id);
  if (!track) {
    throw new ApiError('Track not found', 404);
  }
  res.json(ApiResponse.success(track, 'Track retrieved successfully'));
}));

export default router;
