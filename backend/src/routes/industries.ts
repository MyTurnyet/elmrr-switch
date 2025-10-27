import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { validateIndustry, validateCarDemandConfig } from '../models/industry.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

// GET /api/industries - Get all industries
router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res) => {
  const industries = await dbHelpers.findAll('industries');
  res.json(ApiResponse.success(industries, 'Industries retrieved successfully'));
}));

// GET /api/industries/:id - Get industry by ID
router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const industry = await dbHelpers.findById('industries', req.params.id);
  if (!industry) {
    throw new ApiError('Industry not found', 404);
  }
  res.json(ApiResponse.success(industry, 'Industry retrieved successfully'));
}));

// GET /api/industries/:id/cars - Get cars currently at industry
router.get('/:id/cars', asyncHandler(async (req, res) => {
  const cars = await dbHelpers.findByQuery('cars', { currentIndustry: req.params.id });
  res.json(ApiResponse.success(cars, 'Cars at industry retrieved successfully'));
}));

// POST /api/industries - Create new industry
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = validateIndustry(req.body);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Validate car demand configuration if provided
  if (value.carDemandConfig && value.carDemandConfig.length > 0) {
    const demandValidation = validateCarDemandConfig(value.carDemandConfig);
    if (!demandValidation.valid) {
      throw new ApiError('Invalid car demand configuration', 400, demandValidation.errors);
    }

    // Verify all AAR types exist
    for (const config of value.carDemandConfig) {
      const aarType = await dbHelpers.findById('aarTypes', config.aarTypeId);
      if (!aarType) {
        throw new ApiError(`AAR type '${config.aarTypeId}' does not exist`, 404);
      }
    }
  }

  const newIndustry = await dbHelpers.create('industries', value);
  res.status(201).json(ApiResponse.success(newIndustry, 'Industry created successfully', 201));
}));

// PUT /api/industries/:id - Update industry
router.put('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const { error, value } = validateIndustry(req.body, true);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Validate car demand configuration if provided
  if (value.carDemandConfig && value.carDemandConfig.length > 0) {
    const demandValidation = validateCarDemandConfig(value.carDemandConfig);
    if (!demandValidation.valid) {
      throw new ApiError('Invalid car demand configuration', 400, demandValidation.errors);
    }

    // Verify all AAR types exist
    for (const config of value.carDemandConfig) {
      const aarType = await dbHelpers.findById('aarTypes', config.aarTypeId);
      if (!aarType) {
        throw new ApiError(`AAR type '${config.aarTypeId}' does not exist`, 404);
      }
    }
  }

  const updated = await dbHelpers.update('industries', req.params.id, value);
  if (updated === 0) {
    throw new ApiError('Industry not found', 404);
  }

  const industry = await dbHelpers.findById('industries', req.params.id);
  res.json(ApiResponse.success(industry, 'Industry updated successfully'));
}));

// DELETE /api/industries/:id - Delete industry
router.delete('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const deleted = await dbHelpers.delete('industries', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Industry not found', 404);
  }

  res.json(ApiResponse.success(null, 'Industry deleted successfully'));
}));

export default router;
