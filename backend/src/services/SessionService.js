/**
 * Session Service - Handles complex session management operations
 * Extracted from routes to improve testability and maintainability
 */

import { dbHelpers } from '../database/index.js';
import { 
  validateOperatingSession, 
  createSessionSnapshot, 
  validateSnapshot 
} from '../models/operatingSession.js';
import { ApiError } from '../middleware/errorHandler.js';

export class SessionService {
  constructor() {
    // Service can be extended with repository dependencies if needed
  }

  /**
   * Get or create the current operating session
   * @returns {Promise<Object>} Current session
   */
  async getCurrentSession() {
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

    return currentSession;
  }

  /**
   * Advance to the next operating session
   * @param {string} description - Optional description for the new session
   * @returns {Promise<Object>} Advanced session with stats
   */
  async advanceSession(description = null) {
    // Get current session
    const currentSession = await this.getCurrentSession();

    // Create snapshot of current state
    const snapshot = await createSessionSnapshot();

    // Validate snapshot
    const { error: snapshotError } = validateSnapshot(snapshot);
    if (snapshotError) {
      throw new ApiError('Failed to create session snapshot', 500, snapshotError.details[0].message);
    }

    // Perform session advancement operations
    const stats = await this._performSessionAdvancement(snapshot, currentSession);

    // Update session to next number with snapshot
    const nextSessionNumber = currentSession.currentSessionNumber + 1;
    const updateData = {
      currentSessionNumber: nextSessionNumber,
      sessionDate: new Date().toISOString(),
      description: description || `Operating session ${nextSessionNumber}`,
      previousSessionSnapshot: snapshot
    };

    const { error, value } = validateOperatingSession(updateData);
    if (error) {
      throw new ApiError('Failed to validate session data', 400, error.details.map(d => d.message));
    }

    await dbHelpers.update('operatingSessions', currentSession._id, value);
    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

    return {
      session: updatedSession,
      stats: {
        ...stats,
        advancedToSession: nextSessionNumber
      }
    };
  }

  /**
   * Rollback to the previous operating session
   * @param {string} description - Optional description for the rollback
   * @returns {Promise<Object>} Rolled back session with stats
   */
  async rollbackSession(description = null) {
    // Get current session
    const currentSession = await this.getCurrentSession();

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

    // Perform rollback operations
    const stats = await this._performSessionRollback(snapshot);

    // Update session to previous number and clear snapshot
    const previousSessionNumber = currentSession.currentSessionNumber - 1;
    const updateData = {
      currentSessionNumber: previousSessionNumber,
      sessionDate: new Date().toISOString(),
      description: description || `Rolled back to session ${previousSessionNumber}`,
      previousSessionSnapshot: null // Clear the snapshot after rollback
    };

    const { error, value } = validateOperatingSession(updateData);
    if (error) {
      throw new ApiError('Failed to validate session data', 400, error.details.map(d => d.message));
    }

    await dbHelpers.update('operatingSessions', currentSession._id, value);
    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);

    return {
      session: updatedSession,
      stats: {
        ...stats,
        rolledBackToSession: previousSessionNumber
      }
    };
  }

  /**
   * Update the current session description
   * @param {string} description - New description
   * @returns {Promise<Object>} Updated session
   */
  async updateSessionDescription(description) {
    if (!description || typeof description !== 'string') {
      throw new ApiError('Description is required and must be a string', 400);
    }

    if (description.length > 500) {
      throw new ApiError('Description cannot exceed 500 characters', 400);
    }

    // Get current session
    const currentSession = await this.getCurrentSession();

    // Update description
    await dbHelpers.update('operatingSessions', currentSession._id, {
      description,
      updatedAt: new Date().toISOString()
    });

    const updatedSession = await dbHelpers.findById('operatingSessions', currentSession._id);
    return updatedSession;
  }

  /**
   * Private method to perform session advancement operations
   * @param {Object} snapshot - Current state snapshot
   * @param {Object} currentSession - Current session object
   * @returns {Promise<Object>} Operation statistics
   */
  async _performSessionAdvancement(snapshot, currentSession) {
    const stats = {
      carsUpdated: 0,
      trainsDeleted: 0,
      carsReverted: 0
    };

    // Update car locations (increment sessionsAtCurrentLocation for all cars)
    const cars = await dbHelpers.findAll('cars');
    for (const car of cars) {
      await dbHelpers.update('cars', car._id, {
        sessionsAtCurrentLocation: (car.sessionsAtCurrentLocation || 0) + 1
      });
      stats.carsUpdated++;
    }

    // Delete completed trains
    const completedTrains = await dbHelpers.findByQuery('trains', { status: 'Completed' });
    for (const train of completedTrains) {
      await dbHelpers.delete('trains', train._id);
      stats.trainsDeleted++;
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
            stats.carsReverted++;
          }
        }
      }
    }

    return stats;
  }

  /**
   * Private method to perform session rollback operations
   * @param {Object} snapshot - Previous state snapshot
   * @returns {Promise<Object>} Operation statistics
   */
  async _performSessionRollback(snapshot) {
    const stats = {
      carsRestored: 0,
      trainsRestored: 0,
      ordersRestored: 0
    };

    // Restore car locations from snapshot
    for (const snapshotCar of snapshot.cars) {
      await dbHelpers.update('cars', snapshotCar._id, {
        currentIndustry: snapshotCar.currentIndustry,
        sessionsAtCurrentLocation: snapshotCar.sessionsAtCurrentLocation
      });
      stats.carsRestored++;
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
      stats.trainsRestored++;
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
      stats.ordersRestored++;
    }

    return stats;
  }

  /**
   * Get session statistics and current state info
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats() {
    const currentSession = await this.getCurrentSession();
    
    // Get counts of various entities
    const [cars, trains, carOrders] = await Promise.all([
      dbHelpers.findAll('cars'),
      dbHelpers.findAll('trains'),
      dbHelpers.findAll('carOrders')
    ]);

    const trainsByStatus = trains.reduce((acc, train) => {
      acc[train.status] = (acc[train.status] || 0) + 1;
      return acc;
    }, {});

    const ordersByStatus = carOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      currentSessionNumber: currentSession.currentSessionNumber,
      sessionDate: currentSession.sessionDate,
      description: currentSession.description,
      hasSnapshot: !!currentSession.previousSessionSnapshot,
      canRollback: currentSession.currentSessionNumber > 1 && !!currentSession.previousSessionSnapshot,
      entityCounts: {
        cars: cars.length,
        trains: trains.length,
        carOrders: carOrders.length
      },
      trainsByStatus,
      ordersByStatus
    };
  }
}
