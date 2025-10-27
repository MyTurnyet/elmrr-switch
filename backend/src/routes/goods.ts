import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

router.get('/', asyncHandler(async (_req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const goods = await dbHelpers.findAll('goods');
  res.json(ApiResponse.success(goods, 'Goods retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const good = await dbHelpers.findById('goods', req.params.id);
  if (!good) {
    throw new ApiError('Good not found', 404);
  }
  res.json(ApiResponse.success(good, 'Good retrieved successfully'));
}));

export default router;
