import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const stations = await dbHelpers.findAll('stations');
  res.json(ApiResponse.success(stations, 'Stations retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const station = await dbHelpers.findById('stations', req.params.id);
  if (!station) {
    throw new ApiError('Station not found', 404);
  }
  res.json(ApiResponse.success(station, 'Station retrieved successfully'));
}));

export default router;
