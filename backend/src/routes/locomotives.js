import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const locomotiveRepository = getRepository('locomotives');

// GET /api/locomotives - Get all locomotives
router.get('/', asyncHandler(async (req, res) => {
  const locomotives = await locomotiveRepository.findAll();
  res.json(ApiResponse.success(locomotives, 'Locomotives retrieved successfully'));
}));

// GET /api/locomotives/:id - Get locomotive by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const locomotive = await locomotiveRepository.findByIdOrNull(req.params.id);
  throwIfNull(locomotive, 'Locomotive not found', 404);
  res.json(ApiResponse.success(locomotive, 'Locomotive retrieved successfully'));
}));

export default router;
