import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

router.get('/', asyncHandler(async (_req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const blocks = await dbHelpers.findAll('blocks');
  res.json(ApiResponse.success(blocks, 'Blocks retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const block = await dbHelpers.findById('blocks', req.params.id);
  if (!block) {
    throw new ApiError('Block not found', 404);
  }
  res.json(ApiResponse.success(block, 'Block retrieved successfully'));
}));

export default router;
