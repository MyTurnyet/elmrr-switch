import express from 'express';
import { getRepository } from '../repositories/index.js';
import { getService } from '../services/index.js';
import { dbHelpers } from '../database/index.js';
import { 
  validateTrain, 
  validateTrainNameUniqueness,
  validateLocomotiveAssignments,
  validateStatusTransition,
  validateSwitchListRequirements,
  formatTrainSummary
} from '../models/train.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();
const trainRepository = getRepository('trains');
const sessionRepository = getRepository('operatingSessions');
const routeRepository = getRepository('routes');
const locomotiveRepository = getRepository('locomotives');
const trainService = getService('train');

// GET /api/trains - List all trains with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { sessionNumber, status, routeId, search } = req.query;
  
  const trains = await trainRepository.findWithFilters({
    sessionNumber,
    status,
    routeId,
    search
  });

  // Sort by creation date (newest first)
  trains.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(ApiResponse.success(trains, 'Trains retrieved successfully'));
}));

// GET /api/trains/:id - Get single train with enriched data
router.get('/:id', asyncHandler(async (req, res) => {
  const train = await trainRepository.findById(req.params.id, { enrich: true });
  if (!train) {
    throw new ApiError('Train not found', 404);
  }

  res.json(ApiResponse.success(train, 'Train retrieved successfully'));
}));

// POST /api/trains - Create new train (status: Planned)
router.post('/', asyncHandler(async (req, res) => {
  // Get current session number if not provided
  let sessionNumber = req.body.sessionNumber;
  if (!sessionNumber) {
    const sessions = await sessionRepository.findAll();
    const currentSession = sessions[0];
    if (!currentSession) {
      throw new ApiError('Cannot create train without an active operating session', 404);
    }
    sessionNumber = currentSession.currentSessionNumber;
  }

  const trainData = { ...req.body, sessionNumber, status: 'Planned' };
  
  // Use the repository's built-in validation and creation
  const train = await trainRepository.createTrain(trainData);

  res.json(ApiResponse.success(train, 'Train created successfully'));
}));

// PUT /api/trains/:id - Update train (name, locos, capacity - only if status=Planned)
router.put('/:id', asyncHandler(async (req, res) => {
  const { error, value } = validateTrain(req.body, true); // Allow partial updates
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Check if train exists
  const existingTrain = await dbHelpers.findById('trains', req.params.id);
  if (!existingTrain) {
    throw new ApiError('Train not found', 404);
  }

  // Only allow updates if train is in Planned status
  if (existingTrain.status !== 'Planned') {
    throw new ApiError(`Cannot update train with status: ${existingTrain.status}. Only 'Planned' trains can be updated.`, 400);
  }

  // Verify route if being updated
  if (value.routeId && value.routeId !== existingTrain.routeId) {
    const route = await dbHelpers.findById('routes', value.routeId);
    if (!route) {
      throw new ApiError(`Route with ID '${value.routeId}' does not exist`, 404);
    }
  }

  // Verify locomotives if being updated
  if (value.locomotiveIds) {
    for (const locoId of value.locomotiveIds) {
      const locomotive = await dbHelpers.findById('locomotives', locoId);
      if (!locomotive) {
        throw new ApiError(`Locomotive with ID '${locoId}' does not exist`, 404);
      }
      if (!locomotive.isInService) {
        throw new ApiError(`Locomotive '${locomotive.reportingMarks}' is not in service`, 400);
      }
    }

    // Check locomotive assignment conflicts
    const allTrains = await dbHelpers.findAll('trains');
    const locoValidation = validateLocomotiveAssignments(allTrains, value.locomotiveIds, req.params.id);
    if (!locoValidation.valid) {
      const conflicts = locoValidation.conflicts.map(c => 
        `Locomotive ${c.locomotiveId} is assigned to train '${c.conflictingTrains[0].name}'`
      ).join(', ');
      throw new ApiError('Locomotive assignment conflict', 409, conflicts);
    }
  }

  // Check train name uniqueness if being updated
  if (value.name && value.name !== existingTrain.name) {
    const allTrains = await dbHelpers.findAll('trains');
    const nameValidation = validateTrainNameUniqueness(allTrains, value.name, existingTrain.sessionNumber, req.params.id);
    if (!nameValidation.valid) {
      throw new ApiError(`A train named '${value.name}' already exists in session ${existingTrain.sessionNumber}`, 409);
    }
  }

  // Add updatedAt timestamp
  value.updatedAt = new Date().toISOString();

  const updated = await dbHelpers.update('trains', req.params.id, value);
  if (updated === 0) {
    throw new ApiError('Train not found', 404);
  }

  const train = await dbHelpers.findById('trains', req.params.id);
  res.json(ApiResponse.success(train, 'Train updated successfully'));
}));

// DELETE /api/trains/:id - Delete train (only if status=Planned)
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingTrain = await dbHelpers.findById('trains', req.params.id);
  if (!existingTrain) {
    throw new ApiError('Train not found', 404);
  }

  // Only allow deletion if train is in Planned status
  if (existingTrain.status !== 'Planned') {
    throw new ApiError(`Cannot delete train with status: ${existingTrain.status}. Only 'Planned' trains can be deleted.`, 400);
  }

  const deleted = await dbHelpers.delete('trains', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Train not found', 404);
  }

  res.json(ApiResponse.success(null, 'Train deleted successfully'));
}));

// POST /api/trains/:id/generate-switch-list - Generate switch list (status: Planned → In Progress)
router.post('/:id/generate-switch-list', asyncHandler(async (req, res) => {
  const result = await trainService.generateSwitchList(req.params.id);
  res.json(ApiResponse.success(result.train, 'Switch list generated successfully', 200));
}));

// POST /api/trains/:id/complete - Mark train as completed
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const result = await trainService.completeTrain(req.params.id);
  res.json(ApiResponse.success(result.train, 'Train completed successfully'));
}));

// POST /api/trains/:id/cancel - Cancel train
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const result = await trainService.cancelTrain(req.params.id);
  res.json(ApiResponse.success(result.train, 'Train cancelled successfully'));
}));

export default router;
