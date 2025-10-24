import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateCar } from '../models/car.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// GET /api/cars - Get all cars with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { carType, location, status, homeYard } = req.query;
  let query = {};
  
  if (carType) query.carType = carType;
  if (location) query.currentIndustry = location;
  if (status) query.isInService = status === 'true';
  if (homeYard) query.homeYard = homeYard;

  const cars = await dbHelpers.findByQuery('cars', query);
  res.json(ApiResponse.success(cars, 'Cars retrieved successfully'));
}));

// GET /api/cars/:id - Get car by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const car = await dbHelpers.findById('cars', req.params.id);
  if (!car) {
    throw new ApiError('Car not found', 404);
  }
  res.json(ApiResponse.success(car, 'Car retrieved successfully'));
}));

// POST /api/cars - Create new car
router.post('/', asyncHandler(async (req, res) => {
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
router.put('/:id', asyncHandler(async (req, res) => {
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
router.post('/:id/move', asyncHandler(async (req, res) => {
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
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await dbHelpers.delete('cars', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Car not found', 404);
  }

  res.json(ApiResponse.success(null, 'Car deleted successfully'));
}));

export default router;
