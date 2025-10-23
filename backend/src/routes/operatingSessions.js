import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateOperatingSession, createSessionSnapshot, validateSnapshot } from '../models/operatingSession.js';

const router = express.Router();

// GET /api/sessions/current - Get current session info
router.get('/current', async (req, res) => {
  try {
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
        return res.status(500).json({
          success: false,
          error: 'Failed to create initial session',
          message: error.details[0].message
        });
      }

      currentSession = await dbHelpers.create('operatingSessions', value);
    }

    res.json({
      success: true,
      data: currentSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current session',
      message: error.message
    });
  }
});

// POST /api/sessions/advance - Advance to next session
router.post('/advance', async (req, res) => {
  try {
    // Get current session
    const sessions = await dbHelpers.findAll('operatingSessions');
    const currentSession = sessions[0];

    if (!currentSession) {
      return res.status(404).json({
        success: false,
        error: 'No current session found'
      });
    }

    // Create snapshot of current state
    const cars = await dbHelpers.findAll('cars');
    const trains = await dbHelpers.findAll('trains');
    const carOrders = await dbHelpers.findAll('carOrders');

    const snapshot = createSessionSnapshot(
      currentSession.currentSessionNumber,
      cars,
      trains,
      carOrders
    );

    // Validate snapshot
    const { error: snapshotError } = validateSnapshot(snapshot);
    if (snapshotError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create session snapshot',
        message: snapshotError.details[0].message
      });
    }

    // Increment session number and update session
    const newSessionNumber = currentSession.currentSessionNumber + 1;
    const updatedSessionData = {
      currentSessionNumber: newSessionNumber,
      sessionDate: new Date().toISOString(),
      description: req.body.description || `Operating Session ${newSessionNumber}`,
      previousSessionSnapshot: snapshot
    };

    await dbHelpers.update('operatingSessions', currentSession._id, updatedSessionData);

    // Update all cars: increment sessionsAtCurrentLocation
    for (const car of cars) {
      const newSessionsAtLocation = (car.sessionsAtCurrentLocation || 0) + 1;
      await dbHelpers.update('cars', car._id, {
        sessionsAtCurrentLocation: newSessionsAtLocation
      });
    }

    // Delete all completed trains
    const completedTrains = trains.filter(train => train.status === 'Completed');
    for (const train of completedTrains) {
      await dbHelpers.delete('trains', train._id);
    }

    // Revert cars from "In Progress" or "Planned" trains to their previous locations
    const activeTrains = trains.filter(train => 
      train.status === 'In Progress' || train.status === 'Planned'
    );
    
    for (const train of activeTrains) {
      if (train.assignedCarIds && train.assignedCarIds.length > 0) {
        for (const carId of train.assignedCarIds) {
          // Find the car's location in the snapshot
          const carSnapshot = snapshot.cars.find(c => c.id === carId);
          if (carSnapshot) {
            await dbHelpers.update('cars', carId, {
              currentIndustry: carSnapshot.currentIndustry,
              sessionsAtCurrentLocation: 0 // Reset since we're moving it back
            });
          }
        }
      }
    }

    // TODO: Generate new car orders based on industry demand configurations
    // This will be implemented in Step 2 (Car Order Model & API)

    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

    res.json({
      success: true,
      data: updatedSession,
      message: `Advanced to Session ${newSessionNumber}`,
      stats: {
        trainsDeleted: completedTrains.length,
        carsUpdated: cars.length,
        activeTrainsReverted: activeTrains.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to advance session',
      message: error.message
    });
  }
});

// POST /api/sessions/rollback - Rollback to previous session
router.post('/rollback', async (req, res) => {
  try {
    // Get current session
    const sessions = await dbHelpers.findAll('operatingSessions');
    const currentSession = sessions[0];

    if (!currentSession) {
      return res.status(404).json({
        success: false,
        error: 'No current session found'
      });
    }

    // Check if rollback is possible
    if (currentSession.currentSessionNumber <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot rollback',
        message: 'Cannot rollback from session 1'
      });
    }

    if (!currentSession.previousSessionSnapshot) {
      return res.status(400).json({
        success: false,
        error: 'Cannot rollback',
        message: 'No previous session snapshot available'
      });
    }

    const snapshot = currentSession.previousSessionSnapshot;

    // Validate snapshot
    const { error: snapshotError } = validateSnapshot(snapshot);
    if (snapshotError) {
      return res.status(500).json({
        success: false,
        error: 'Invalid session snapshot',
        message: snapshotError.details[0].message
      });
    }

    // Restore car locations from snapshot
    for (const carSnapshot of snapshot.cars) {
      await dbHelpers.update('cars', carSnapshot.id, {
        currentIndustry: carSnapshot.currentIndustry,
        sessionsAtCurrentLocation: carSnapshot.sessionsAtCurrentLocation
      });
    }

    // Delete all current trains
    const currentTrains = await dbHelpers.findAll('trains');
    for (const train of currentTrains) {
      await dbHelpers.delete('trains', train._id);
    }

    // Restore trains from snapshot
    if (snapshot.trains && snapshot.trains.length > 0) {
      await dbHelpers.bulkInsert('trains', snapshot.trains);
    }

    // Delete all current car orders
    const currentCarOrders = await dbHelpers.findAll('carOrders');
    for (const order of currentCarOrders) {
      await dbHelpers.delete('carOrders', order._id);
    }

    // Restore car orders from snapshot
    if (snapshot.carOrders && snapshot.carOrders.length > 0) {
      await dbHelpers.bulkInsert('carOrders', snapshot.carOrders);
    }

    // Update session: decrement number, clear snapshot
    const updatedSessionData = {
      currentSessionNumber: snapshot.sessionNumber,
      sessionDate: new Date().toISOString(),
      description: `Rolled back to Session ${snapshot.sessionNumber}`,
      previousSessionSnapshot: null // Clear snapshot after rollback
    };

    await dbHelpers.update('operatingSessions', currentSession._id, updatedSessionData);

    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

    res.json({
      success: true,
      data: updatedSession,
      message: `Rolled back to Session ${snapshot.sessionNumber}`,
      stats: {
        carsRestored: snapshot.cars.length,
        trainsRestored: snapshot.trains.length,
        carOrdersRestored: snapshot.carOrders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to rollback session',
      message: error.message
    });
  }
});

// PUT /api/sessions/current - Update session description
router.put('/current', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Description is required and must be a string'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Description cannot exceed 500 characters'
      });
    }

    // Get current session
    const sessions = await dbHelpers.findAll('operatingSessions');
    const currentSession = sessions[0];

    if (!currentSession) {
      return res.status(404).json({
        success: false,
        error: 'No current session found'
      });
    }

    await dbHelpers.update('operatingSessions', currentSession._id, { description });

    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

    res.json({
      success: true,
      data: updatedSession,
      message: 'Session description updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update session description',
      message: error.message
    });
  }
});

export default router;
