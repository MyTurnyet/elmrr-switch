import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const goodRepository = getRepository('goods');

router.get('/', asyncHandler(async (req, res) => {
  const goods = await goodRepository.findAll();
  res.json(ApiResponse.success(goods, 'Goods retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const good = await goodRepository.findByIdOrNull(req.params.id);
  throwIfNull(good, 'Good not found', 404);
  res.json(ApiResponse.success(good, 'Good retrieved successfully'));
}));

export default router;
