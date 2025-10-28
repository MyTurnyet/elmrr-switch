import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const trackRepository = getRepository('tracks');

router.get('/', asyncHandler(async (req, res) => {
  const tracks = await trackRepository.findAll();
  res.json(ApiResponse.success(tracks, 'Tracks retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const track = await trackRepository.findByIdOrNull(req.params.id);
  throwIfNull(track, 'Track not found', 404);
  res.json(ApiResponse.success(track, 'Track retrieved successfully'));
}));

export default router;
