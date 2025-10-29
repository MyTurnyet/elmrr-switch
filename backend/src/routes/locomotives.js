/**
 * Locomotive Routes
 * Handles all locomotive-related API endpoints with full CRUD operations
 */

import express from 'express';
import { getRepository } from '../repositories/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { LocomotiveTransformer } from '../transformers/LocomotiveTransformer.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

const router = express.Router();
const locomotiveRepository = getRepository('locomotives');
const locomotiveTransformer = new LocomotiveTransformer();

// GET /api/locomotives - Get all locomotives with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  // Build filter query using transformer
  const query = LocomotiveTransformer.buildFilterQuery(req.query);
  
  // Get locomotives from repository
  let locomotives;
  if (Object.keys(query).length > 0) {
    locomotives = await locomotiveRepository.findBy(query);
  } else {
    locomotives = await locomotiveRepository.findAll();
  }
  
  // Transform response
  const view = req.query.view || 'list';
  const transformedLocomotives = locomotiveTransformer.transformCollection(locomotives, { view });
  
  res.json(ApiResponse.success(transformedLocomotives, 'Locomotives retrieved successfully'));
}));

// GET /api/locomotives/statistics - Get locomotive statistics
router.get('/statistics', asyncHandler(async (req, res) => {
  const statistics = await locomotiveRepository.getStatistics();
  res.json(ApiResponse.success(statistics, 'Statistics retrieved successfully'));
}));

// GET /api/locomotives/available - Get available locomotives (in service, not assigned)
router.get('/available', asyncHandler(async (req, res) => {
  const availableLocomotives = await locomotiveRepository.findAvailable();
  const view = req.query.view || 'list';
  const transformed = locomotiveTransformer.transformCollection(availableLocomotives, { view });
  res.json(ApiResponse.success(transformed, 'Available locomotives retrieved successfully'));
}));

// GET /api/locomotives/:id - Get locomotive by ID with enriched data
router.get('/:id', asyncHandler(async (req, res) => {
  const locomotive = await locomotiveRepository.findByIdOrNull(req.params.id);
  throwIfNull(locomotive, 'Locomotive not found', 404);
  
  // Enrich with related data
  const enriched = await locomotiveRepository.enrich(locomotive);
  
  // Transform for detail view
  const transformed = locomotiveTransformer.transform(enriched, { view: 'detail' });
  res.json(ApiResponse.success(transformed, 'Locomotive retrieved successfully'));
}));

// GET /api/locomotives/:id/assignments - Check train assignments
router.get('/:id/assignments', asyncHandler(async (req, res) => {
  const locomotive = await locomotiveRepository.findByIdOrNull(req.params.id);
  throwIfNull(locomotive, 'Locomotive not found', 404);
  
  const assignments = await locomotiveRepository.checkTrainAssignments(req.params.id);
  res.json(ApiResponse.success(assignments, 'Train assignments retrieved successfully'));
}));

// POST /api/locomotives - Create new locomotive
router.post('/', asyncHandler(async (req, res) => {
  // Validate using repository (includes business logic validation)
  const validatedData = await locomotiveRepository.validate(req.body, 'create');
  
  // Create locomotive
  const newLocomotive = await locomotiveRepository.create(validatedData);
  
  // Enrich and transform response
  const enriched = await locomotiveRepository.enrich(newLocomotive);
  const transformed = locomotiveTransformer.transform(enriched, { view: 'detail' });
  
  res.status(201).json(ApiResponse.success(transformed, 'Locomotive created successfully', 201));
}));

// PUT /api/locomotives/:id - Update locomotive
router.put('/:id', asyncHandler(async (req, res) => {
  // Check if locomotive exists
  const existing = await locomotiveRepository.findByIdOrNull(req.params.id);
  throwIfNull(existing, 'Locomotive not found', 404);
  
  // Check if locomotive is assigned to active trains
  const assignments = await locomotiveRepository.checkTrainAssignments(req.params.id);
  
  // If trying to set isInService=false and locomotive is assigned, prevent it
  if (req.body.isInService === false && assignments.isAssigned) {
    throw new ApiError(
      `Cannot set locomotive out of service. It is assigned to ${assignments.trainCount} active train(s)`,
      409,
      assignments.trains.map(t => `Train '${t.name}' (${t.status})`)
    );
  }
  
  // Validate using repository (includes business logic validation)
  const validatedData = await locomotiveRepository.validate(req.body, 'update', req.params.id);
  
  // Update locomotive
  const updated = await locomotiveRepository.update(req.params.id, validatedData);
  if (!updated) {
    throw new ApiError('Failed to update locomotive', 500);
  }
  
  // Get updated locomotive with enrichment
  const locomotive = await locomotiveRepository.findById(req.params.id);
  const enriched = await locomotiveRepository.enrich(locomotive);
  const transformed = locomotiveTransformer.transform(enriched, { view: 'detail' });
  
  res.json(ApiResponse.success(transformed, 'Locomotive updated successfully'));
}));

// DELETE /api/locomotives/:id - Delete locomotive
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check if locomotive exists
  const existing = await locomotiveRepository.findByIdOrNull(req.params.id);
  throwIfNull(existing, 'Locomotive not found', 404);
  
  // Check if locomotive is assigned to active trains
  const assignments = await locomotiveRepository.checkTrainAssignments(req.params.id);
  
  if (assignments.isAssigned) {
    throw new ApiError(
      `Cannot delete locomotive. It is assigned to ${assignments.trainCount} active train(s)`,
      409,
      assignments.trains.map(t => `Train '${t.name}' (${t.status})`)
    );
  }
  
  // Delete locomotive
  const deleted = await locomotiveRepository.delete(req.params.id);
  if (!deleted) {
    throw new ApiError('Failed to delete locomotive', 500);
  }
  
  res.json(ApiResponse.success(null, 'Locomotive deleted successfully'));
}));

export default router;
