import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const blockRepository = getRepository('blocks');

router.get('/', asyncHandler(async (req, res) => {
  const blocks = await blockRepository.findAll();
  res.json(ApiResponse.success(blocks, 'Blocks retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const block = await blockRepository.findByIdOrNull(req.params.id);
  throwIfNull(block, 'Block not found', 404);
  res.json(ApiResponse.success(block, 'Block retrieved successfully'));
}));

export default router;
