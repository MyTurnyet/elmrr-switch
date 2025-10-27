import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const stationRepository = getRepository('stations');

router.get('/', asyncHandler(async (req, res) => {
  const stations = await stationRepository.findAll();
  res.json(ApiResponse.success(stations, 'Stations retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const station = await stationRepository.findByIdOrNull(req.params.id);
  throwIfNull(station, 'Station not found', 404);
  res.json(ApiResponse.success(station, 'Station retrieved successfully'));
}));

export default router;
