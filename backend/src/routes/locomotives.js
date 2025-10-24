import express from 'express';
import { dbHelpers } from '../database/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// GET /api/locomotives - Get all locomotives
router.get('/', asyncHandler(async (req, res) => {
  const locomotives = await dbHelpers.findAll('locomotives');
  res.json(ApiResponse.success(locomotives, 'Locomotives retrieved successfully'));
}));

// GET /api/locomotives/:id - Get locomotive by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const locomotive = await dbHelpers.findById('locomotives', req.params.id);
  if (!locomotive) {
    throw new ApiError('Locomotive not found', 404);
  }
  res.json(ApiResponse.success(locomotive, 'Locomotive retrieved successfully'));
}));

export default router;
