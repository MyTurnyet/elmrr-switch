import express, { Router, Response } from 'express';
import { dbHelpers } from '../database/index.js';
import { validateCar } from '../models/car.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { CarTransformer, parsePagination } from '../transformers/index.js';
import type { 
  TypedRequest, 
  IdParam, 
  StandardQuery
} from '../types/index.js';

const router: Router = express.Router();
const carTransformer = new CarTransformer();

// GET /api/cars - Get all cars with optional filtering
router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res: Response) => {
  // Build filter query using transformer
  const query = CarTransformer.buildFilterQuery(req.query);
  
  // Parse pagination
  const pagination = parsePagination(req.query);
  
  // Get cars from database
  const cars = await dbHelpers.findByQuery('cars', query);
  
  // Transform response
  const view = req.query.view || 'default';
  const transformedCars = carTransformer.transformCollection(cars, { view });
  
  // Return with pagination if requested
  if (req.query.page) {
    const paginated = carTransformer.transformPaginated(cars, {
      ...pagination,
      total: cars.length
    }, { view });
    res.json(ApiResponse.success(paginated, 'Cars retrieved successfully'));
  } else {
    res.json(ApiResponse.success(transformedCars, 'Cars retrieved successfully'));
  }
}));

// GET /api/cars/:id - Get car by ID
router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res: Response) => {
  const car = await dbHelpers.findById('cars', req.params.id);
  if (!car) {
    throw new ApiError('Car not found', 404);
  }
  
  // Transform for detail view
  const transformedCar = carTransformer.transformForDetail(car);
  res.json(ApiResponse.success(transformedCar, 'Car retrieved successfully'));
}));

// POST /api/cars - Create new car
router.post('/', asyncHandler(async (req: any, res: Response) => {
  const { error, value } = validateCar(req.body);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Check for duplicate reporting marks/number combination
  const existing = await dbHelpers.findByQuery('cars', {
    reportingMarks: value.reportingMarks,
    reportingNumber: value.reportingNumber
  });

  if (existing.length > 0) {
    throw new ApiError('Car with these reporting marks and number already exists', 409);
  }

  const newCar = await dbHelpers.create('cars', {
    ...value,
    sessionsAtCurrentLocation: 0,
    lastMoved: new Date()
  });

  res.status(201).json(ApiResponse.success(newCar, 'Car created successfully', 201));
}));

// PUT /api/cars/:id - Update car
router.put('/:id', asyncHandler(async (req: any, res: Response) => {
  const { error, value } = validateCar(req.body, true); // Allow partial updates
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  const updated = await dbHelpers.update('cars', req.params.id, value);
  if (updated === 0) {
    throw new ApiError('Car not found', 404);
  }

  const car = await dbHelpers.findById('cars', req.params.id);
  res.json(ApiResponse.success(car, 'Car updated successfully'));
}));

// POST /api/cars/:id/move - Move car to different industry
router.post('/:id/move', asyncHandler(async (req: any, res: Response) => {
  const { destinationIndustryId } = req.body;
  if (!destinationIndustryId) {
    throw new ApiError('Destination industry ID is required', 400);
  }

  // Verify destination industry exists
  const industry = await dbHelpers.findById('industries', destinationIndustryId);
  if (!industry) {
    throw new ApiError('Destination industry not found', 404);
  }

  const updated = await dbHelpers.update('cars', req.params.id, {
    currentIndustry: destinationIndustryId,
    lastMoved: new Date(),
    sessionsAtCurrentLocation: 0
  });

  if (updated === 0) {
    throw new ApiError('Car not found', 404);
  }

  const car = await dbHelpers.findById('cars', req.params.id);
  res.json(ApiResponse.success(car, 'Car moved successfully'));
}));

// DELETE /api/cars/:id - Delete car
router.delete('/:id', asyncHandler(async (req: any, res: Response) => {
  const deleted = await dbHelpers.delete('cars', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Car not found', 404);
  }

  res.json(ApiResponse.success(null, 'Car deleted successfully'));
}));

export default router;
