import express, { Router } from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();
const aarTypeRepository = getRepository('aarTypes');

router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const aarTypes = await aarTypeRepository.findAll();
  res.json(ApiResponse.success(aarTypes, 'AAR types retrieved successfully'));
}));

router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const aarType = await aarTypeRepository.findById(req.params.id);
  if (!aarType) {
    throw new ApiError('AAR type not found', 404);
  }
  res.json(ApiResponse.success(aarType, 'AAR type retrieved successfully'));
}));

export default router;
