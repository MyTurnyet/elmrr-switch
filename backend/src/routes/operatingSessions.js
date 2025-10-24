import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateOperatingSession, createSessionSnapshot, validateSnapshot } from '../models/operatingSession.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// GET /api/sessions/current - Get current session info
router.get('/current', asyncHandler(async (req, res) => {
  // Find the current session (should only be one)
  const sessions = await dbHelpers.findAll('operatingSessions');
  let currentSession = sessions[0];

  // If no session exists, create the initial session
  if (!currentSession) {
    const { error, value } = validateOperatingSession({
      currentSessionNumber: 1,
      sessionDate: new Date().toISOString(),
      description: 'Initial operating session',
      previousSessionSnapshot: null
    });

    if (error) {
      throw new ApiError('Failed to create initial session', 500, error.details.map(d => d.message));
    }

    currentSession = await dbHelpers.create('operatingSessions', value);
  }

  res.json(ApiResponse.success(currentSession, 'Current session retrieved successfully'));
}));

// POST /api/sessions/advance - Advance to next session
router.post('/advance', asyncHandler(async (req, res) => {
  // Get current session
  const sessions = await dbHelpers.findAll('operatingSessions');
  const currentSession = sessions[0];

  if (!currentSession) {
    throw new ApiError('No current session found', 404);
  }

  // Create snapshot of current state
  const snapshot = await createSessionSnapshot();

  // Validate snapshot
  const { error: snapshotError } = validateSnapshot(snapshot);
  if (snapshotError) {
    throw new ApiError('Failed to create session snapshot', 500, snapshotError.details[0].message);
  }

  // Update car locations (increment sessionsAtCurrentLocation for all cars)
  const cars = await dbHelpers.findAll('cars');
  for (const car of cars) {
    await dbHelpers.update('cars', car._id, {
      sessionsAtCurrentLocation: (car.sessionsAtCurrentLocation || 0) + 1
    });
  }

  // Delete completed trains
  const completedTrains = await dbHelpers.findByQuery('trains', { status: 'Completed' });
  for (const train of completedTrains) {
    await dbHelpers.delete('trains', train._id);
  }

  // Revert cars from active trains (In Progress) back to their original locations
  const activeTrains = await dbHelpers.findByQuery('trains', { status: 'In Progress' });
  for (const train of activeTrains) {
    if (train.assignedCarIds && train.assignedCarIds.length > 0) {
      for (const carId of train.assignedCarIds) {
        // Find the car's original location from the snapshot
        const originalCar = snapshot.cars.find(c => c._id === carId);
        if (originalCar) {
          await dbHelpers.update('cars', carId, {
            currentIndustry: originalCar.currentIndustry,
            sessionsAtCurrentLocation: 0 // Reset counter
          });
        }
      }
    }
  }

  // Update session to next number with snapshot
  const nextSessionNumber = currentSession.currentSessionNumber + 1;
  const updateData = {
    currentSessionNumber: nextSessionNumber,
    sessionDate: new Date().toISOString(),
    description: req.body.description || `Operating session ${nextSessionNumber}`,
    previousSessionSnapshot: snapshot
  };

  const { error, value } = validateOperatingSession(updateData);
  if (error) {
    throw new ApiError('Failed to validate session data', 400, error.details.map(d => d.message));
  }

  await dbHelpers.update('operatingSessions', currentSession._id, value);

  const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

  res.json(ApiResponse.success(updatedSession, `Advanced to session ${nextSessionNumber}`));
}));

// POST /api/sessions/rollback - Rollback to previous session
router.post('/rollback', asyncHandler(async (req, res) => {
  // Get current session
  const sessions = await dbHelpers.findAll('operatingSessions');
  const currentSession = sessions[0];

  if (!currentSession) {
    throw new ApiError('No current session found', 404);
  }

  // Check if rollback is possible
  if (currentSession.currentSessionNumber <= 1) {
    throw new ApiError('Cannot rollback from session 1', 400);
  }

  if (!currentSession.previousSessionSnapshot) {
    throw new ApiError('No previous session snapshot available', 400);
  }

  const snapshot = currentSession.previousSessionSnapshot;

  // Validate snapshot
  const { error: snapshotError } = validateSnapshot(snapshot);
  if (snapshotError) {
    throw new ApiError('Invalid session snapshot', 500, snapshotError.details[0].message);
  }

  // Restore car locations from snapshot
  for (const snapshotCar of snapshot.cars) {
    await dbHelpers.update('cars', snapshotCar._id, {
      currentIndustry: snapshotCar.currentIndustry,
      sessionsAtCurrentLocation: snapshotCar.sessionsAtCurrentLocation
    });
  }

  // Restore trains from snapshot
  // First, delete all current trains
  const currentTrains = await dbHelpers.findAll('trains');
  for (const train of currentTrains) {
    await dbHelpers.delete('trains', train._id);
  }

  // Then restore trains from snapshot
  for (const snapshotTrain of snapshot.trains) {
    await dbHelpers.create('trains', snapshotTrain);
  }

  // Restore car orders from snapshot
  // First, delete all current car orders
  const currentOrders = await dbHelpers.findAll('carOrders');
  for (const order of currentOrders) {
    await dbHelpers.delete('carOrders', order._id);
  }

  // Then restore car orders from snapshot
  for (const snapshotOrder of snapshot.carOrders) {
    await dbHelpers.create('carOrders', snapshotOrder);
  }

  // Update session to previous number and clear snapshot
  const previousSessionNumber = currentSession.currentSessionNumber - 1;
  const updateData = {
    currentSessionNumber: previousSessionNumber,
    sessionDate: new Date().toISOString(),
    description: req.body.description || `Rolled back to session ${previousSessionNumber}`,
    previousSessionSnapshot: null // Clear the snapshot after rollback
  };

  const { error, value } = validateOperatingSession(updateData);
  if (error) {
    throw new ApiError('Failed to validate session data', 400, error.details.map(d => d.message));
  }

  await dbHelpers.update('operatingSessions', currentSession._id, value);

  const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

  res.json(ApiResponse.success(updatedSession, `Rolled back to session ${previousSessionNumber}`));
}));

// PUT /api/sessions/current - Update current session description
router.put('/current', asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    throw new ApiError('Description is required and must be a string', 400);
  }

  if (description.length > 500) {
    throw new ApiError('Description cannot exceed 500 characters', 400);
  }

  // Get current session
  const sessions = await dbHelpers.findAll('operatingSessions');
  const currentSession = sessions[0];

  if (!currentSession) {
    throw new ApiError('No current session found', 404);
  }

  // Update description
  await dbHelpers.update('operatingSessions', currentSession._id, {
    description,
    updatedAt: new Date().toISOString()
  });

  const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

  res.json(ApiResponse.success(updatedSession, 'Session description updated successfully'));
}));

export default router;
