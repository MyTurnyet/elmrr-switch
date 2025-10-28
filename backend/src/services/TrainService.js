/**
 * Train Service - Handles complex train business operations
 * Extracted from routes to improve testability and maintainability
 */

import logger from '../utils/logger.js';
import { getRepository } from '../repositories/index.js';
import { dbHelpers } from '../database/index.js';
import { 
  validateSwitchListRequirements,
  validateStatusTransition
} from '../models/train.js';
import { ApiError } from '../middleware/errorHandler.js';
import { throwIfNull } from '../utils/nullObjectHelpers.js';

export class TrainService {
  constructor() {
    this.trainRepo = getRepository('trains');
    this.carOrderRepo = getRepository('carOrders');
    this.carRepo = getRepository('cars');
    this.routeRepo = getRepository('routes');
    this.locomotiveRepo = getRepository('locomotives');
    this.industryRepo = getRepository('industries');
    this.stationRepo = getRepository('stations');
  }

  /**
   * Generate switch list for a train
   * @param {string} trainId - Train ID
   * @returns {Promise<Object>} Switch list generation result
   */
  async generateSwitchList(trainId) {
    logger.info('Generating switch list', { trainId });
    
    // Get train with enriched data
    const train = await this.trainRepo.findByIdOrNull(trainId, { enrich: true });
    throwIfNull(train, 'Train not found', 404);

    // Validate train status
    if (train.status !== 'Planned') {
      logger.warn('Switch list generation failed - invalid status', { 
        trainId, 
        trainName: train.name,
        currentStatus: train.status 
      });
      throw new ApiError(`Cannot generate switch list for train with status: ${train.status}. Only 'Planned' trains can generate switch lists.`, 400);
    }

    // Get route and locomotives
    const route = await dbHelpers.findById('routes', train.routeId);
    const locomotives = await Promise.all(
      train.locomotiveIds.map(id => dbHelpers.findById('locomotives', id))
    );

    // Validate requirements
    const validation = validateSwitchListRequirements(train, route, locomotives.filter(Boolean));
    if (!validation.valid) {
      logger.warn('Switch list validation failed', { 
        trainId, 
        trainName: train.name,
        errors: validation.errors 
      });
      throw new ApiError('Cannot generate switch list', 400, validation.errors.join(', '));
    }

    // Generate the switch list
    const switchListResult = await this._generateSwitchListAlgorithm(train, route);
    
    if (!switchListResult.success) {
      logger.error('Switch list algorithm failed', { 
        trainId, 
        trainName: train.name,
        message: switchListResult.message 
      });
      throw new ApiError('Switch list generation failed', 500, switchListResult.message);
    }

    // Update train with switch list and change status to In Progress
    const updateData = {
      switchList: switchListResult.switchList,
      assignedCarIds: switchListResult.assignedCarIds,
      status: 'In Progress',
      updatedAt: new Date().toISOString()
    };

    await this.trainRepo.update(trainId, updateData);

    // Update car orders to assigned status
    for (const carOrderUpdate of switchListResult.carOrderUpdates) {
      await dbHelpers.update('carOrders', carOrderUpdate.orderId, {
        status: 'assigned',
        assignedCarId: carOrderUpdate.carId,
        assignedTrainId: trainId
      });
    }

    logger.info('Switch list generated successfully', {
      trainId,
      trainName: train.name,
      stationsServed: switchListResult.switchList.stations.length,
      totalPickups: switchListResult.switchList.totalPickups,
      totalSetouts: switchListResult.switchList.totalSetouts,
      assignedCars: switchListResult.assignedCarIds.length
    });

    // Get updated train with enriched data
    const updatedTrain = await this.trainRepo.findById(trainId, { enrich: true });

    return {
      train: updatedTrain,
      stats: {
        stationsServed: switchListResult.switchList.stations.length,
        totalPickups: switchListResult.switchList.totalPickups,
        totalSetouts: switchListResult.switchList.totalSetouts,
        finalCarCount: switchListResult.switchList.finalCarCount,
        carOrdersFulfilled: switchListResult.carOrderUpdates.length
      }
    };
  }

  /**
   * Complete a train
   * @param {string} trainId - Train ID
   * @returns {Promise<Object>} Completion result
   */
  async completeTrain(trainId) {
    const train = await this.trainRepo.findByIdOrNull(trainId);
    throwIfNull(train, 'Train not found', 404);

    if (train.status !== 'In Progress') {
      throw new ApiError(`Cannot complete train with status: ${train.status}. Only 'In Progress' trains can be completed.`, 400);
    }

    // Move cars to their destinations and reset session counters
    const carUpdates = [];
    if (train.switchList && train.switchList.stations) {
      for (const station of train.switchList.stations) {
        for (const setout of station.setouts) {
          await dbHelpers.update('cars', setout.carId, {
            currentIndustry: setout.destinationIndustryId,
            sessionsAtCurrentLocation: 0 // Reset counter for moved cars
          });
          carUpdates.push({
            carId: setout.carId,
            newLocation: setout.destinationIndustryId
          });
        }
      }
    }

    // Update car orders to delivered status
    const carOrders = await dbHelpers.findByQuery('carOrders', { assignedTrainId: trainId });
    const deliveredOrders = [];
    for (const order of carOrders) {
      if (order.status === 'assigned' || order.status === 'in-transit') {
        await dbHelpers.update('carOrders', order._id, {
          status: 'delivered'
        });
        deliveredOrders.push(order);
      }
    }

    // Update train status to Completed
    await this.trainRepo.update(trainId, {
      status: 'Completed',
      updatedAt: new Date().toISOString()
    });

    const updatedTrain = await this.trainRepo.findById(trainId, { enrich: true });

    return {
      train: updatedTrain,
      stats: {
        carsMoved: carUpdates.length,
        ordersDelivered: deliveredOrders.length
      }
    };
  }

  /**
   * Cancel a train
   * @param {string} trainId - Train ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelTrain(trainId) {
    const train = await this.trainRepo.findByIdOrNull(trainId);
    throwIfNull(train, 'Train not found', 404);

    // Cannot cancel completed trains
    if (train.status === 'Completed') {
      throw new ApiError('Cannot cancel completed train', 400, 'Completed trains cannot be cancelled');
    }

    let revertedOrders = [];

    // If train is In Progress, revert car orders
    if (train.status === 'In Progress') {
      const carOrders = await dbHelpers.findByQuery('carOrders', { assignedTrainId: trainId });
      for (const order of carOrders) {
        if (order.status === 'assigned' || order.status === 'in-transit') {
          await dbHelpers.update('carOrders', order._id, {
            status: 'pending',
            assignedCarId: null,
            assignedTrainId: null
          });
          revertedOrders.push(order);
        }
      }
    }

    // Update train status to Cancelled
    await this.trainRepo.update(trainId, {
      status: 'Cancelled',
      updatedAt: new Date().toISOString()
    });

    const updatedTrain = await this.trainRepo.findById(trainId, { enrich: true });

    return {
      train: updatedTrain,
      stats: {
        ordersReverted: revertedOrders.length
      }
    };
  }

  /**
   * Switch List Generation Algorithm
   * Private method that implements the complex routing logic
   * @param {Object} train - Train object
   * @param {Object} route - Route object
   * @returns {Promise<Object>} Switch list result
   */
  async _generateSwitchListAlgorithm(train, route) {
    try {
      // Get all stations in the route sequence
      const stationSequence = [route.originYard, ...route.stationSequence, route.terminationYard];
      const stations = [];
      
      // Get station details
      for (const stationId of stationSequence) {
        const station = await dbHelpers.findById('stations', stationId);
        if (station) {
          stations.push(station);
        }
      }

      if (stations.length === 0) {
        return {
          success: false,
          message: 'No valid stations found in route'
        };
      }

      const switchListStations = [];
      const assignedCarIds = [];
      const carOrderUpdates = [];
      let currentCarCount = 0;
      let totalPickups = 0;
      let totalSetouts = 0;

      // Process each station in sequence
      for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        const stationPickups = [];
        const stationSetouts = [];

        // Get industries at this station
        const industries = await dbHelpers.findByQuery('industries', { stationId: station._id });

        // Find pending car orders at industries in this station
        const pendingOrders = await dbHelpers.findByQuery('carOrders', {
          status: 'pending',
          sessionNumber: train.sessionNumber
        });

        const stationOrders = pendingOrders.filter(order =>
          industries.some(industry => industry._id === order.industryId)
        );

        // Find available cars at this station
        const availableCars = await dbHelpers.findByQuery('cars', {
          isInService: true
        });

        const stationCars = availableCars.filter(car =>
          industries.some(industry => industry._id === car.currentIndustry)
        );

        // Process car orders (pickups)
        for (const order of stationOrders) {
          // Check if we're at capacity
          if (currentCarCount >= train.maxCapacity) {
            break;
          }

          // Find a matching car for this order
          const matchingCar = stationCars.find(car =>
            car.carType === order.aarTypeId &&
            !assignedCarIds.includes(car._id)
          );

          if (matchingCar) {
            // Find destination industry for this car
            const destinationIndustry = await dbHelpers.findById('industries', order.industryId);
            
            if (destinationIndustry) {
              stationPickups.push({
                carId: matchingCar._id,
                carReportingMarks: matchingCar.reportingMarks,
                carNumber: matchingCar.reportingNumber,
                carType: matchingCar.carType,
                destinationIndustryId: destinationIndustry._id,
                destinationIndustryName: destinationIndustry.name,
                carOrderId: order._id
              });

              assignedCarIds.push(matchingCar._id);
              carOrderUpdates.push({
                orderId: order._id,
                carId: matchingCar._id
              });
              currentCarCount++;
              totalPickups++;
            }
          }
        }

        // Process setouts (cars reaching their destination at this station)
        const carsToSetout = stationPickups.filter(pickup => {
          // Check if any industry at this station is the destination
          return industries.some(industry => industry._id === pickup.destinationIndustryId);
        });

        // Move cars from pickups to setouts if they're being delivered here
        for (const setout of carsToSetout) {
          // Remove from pickups
          const pickupIndex = stationPickups.findIndex(p => p.carId === setout.carId);
          if (pickupIndex > -1) {
            stationPickups.splice(pickupIndex, 1);
            totalPickups--; // Adjust count since we're not actually picking up
          }

          stationSetouts.push(setout);
          currentCarCount--;
          totalSetouts++;
        }

        // Add cars being routed to home yards (additional logic)
        const additionalCars = stationCars.filter(car =>
          !assignedCarIds.includes(car._id) &&
          currentCarCount < train.maxCapacity
        ).slice(0, train.maxCapacity - currentCarCount);

        for (const car of additionalCars) {
          // Route to home yard if different from current location
          if (car.homeYard !== car.currentIndustry) {
            const homeYard = await dbHelpers.findById('industries', car.homeYard);
            if (homeYard) {
              stationPickups.push({
                carId: car._id,
                carReportingMarks: car.reportingMarks,
                carNumber: car.reportingNumber,
                carType: car.carType,
                destinationIndustryId: homeYard._id,
                destinationIndustryName: homeYard.name,
                carOrderId: null // No specific order
              });

              assignedCarIds.push(car._id);
              currentCarCount++;
              totalPickups++;
            }
          }
        }

        // Create station entry
        switchListStations.push({
          stationId: station._id,
          stationName: station.name,
          pickups: stationPickups,
          setouts: stationSetouts
        });
      }

      const switchList = {
        stations: switchListStations,
        totalPickups,
        totalSetouts,
        finalCarCount: currentCarCount,
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        switchList,
        assignedCarIds,
        carOrderUpdates
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
