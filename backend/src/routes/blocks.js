import express from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const blocks = await dbHelpers.findAll('blocks');
  res.json(ApiResponse.success(blocks, 'Blocks retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const block = await dbHelpers.findById('blocks', req.params.id);
  if (!block) {
    throw new ApiError('Block not found', 404);
  }
  res.json(ApiResponse.success(block, 'Block retrieved successfully'));
}));

export default router;
