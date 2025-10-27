import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const aarTypeRepository = getRepository('aarTypes');

router.get('/', asyncHandler(async (req, res) => {
  const aarTypes = await aarTypeRepository.findAll();
  res.json(ApiResponse.success(aarTypes, 'AAR types retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const aarType = await aarTypeRepository.findByIdOrNull(req.params.id);
  throwIfNull(aarType, 'AAR type not found', 404);
  res.json(ApiResponse.success(aarType, 'AAR type retrieved successfully'));
}));

export default router;
