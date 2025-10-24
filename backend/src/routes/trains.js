import express from 'express';
import { getRepository } from '../repositories/index.js';
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
  const train = await dbHelpers.findById('trains', req.params.id);
  if (!train) {
    throw new ApiError('Train not found', 404);
  }

  // Get route and locomotives
  const route = await dbHelpers.findById('routes', train.routeId);
  const locomotives = await Promise.all(
    train.locomotiveIds.map(id => dbHelpers.findById('locomotives', id))
  );

  // Validate requirements
  const validation = validateSwitchListRequirements(train, route, locomotives.filter(Boolean));
  if (!validation.valid) {
    throw new ApiError('Cannot generate switch list', 400, validation.errors.join(', '));
  }

  // Generate switch list using the algorithm
  const switchListResult = await generateSwitchList(train, route);
  
  if (!switchListResult.success) {
    throw new ApiError('Switch list generation failed', 500, switchListResult.message);
  }

  // Update train with switch list and change status to In Progress
  const updateData = {
    switchList: switchListResult.switchList,
    assignedCarIds: switchListResult.assignedCarIds,
    status: 'In Progress',
    updatedAt: new Date().toISOString()
  };

  await dbHelpers.update('trains', req.params.id, updateData);

  // Update car orders to assigned status
  for (const carOrderUpdate of switchListResult.carOrderUpdates) {
    await dbHelpers.update('carOrders', carOrderUpdate.orderId, {
      status: 'assigned',
      assignedCarId: carOrderUpdate.carId,
      assignedTrainId: req.params.id
    });
  }

  const updatedTrain = await dbHelpers.findById('trains', req.params.id);

  res.json(ApiResponse.success(updatedTrain, 'Switch list generated successfully', 200));
}));

// POST /api/trains/:id/complete - Mark train as completed
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const train = await dbHelpers.findById('trains', req.params.id);
  if (!train) {
    throw new ApiError('Train not found', 404);
  }

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
  const carOrders = await dbHelpers.findByQuery('carOrders', { assignedTrainId: req.params.id });
  for (const order of carOrders) {
    if (order.status === 'assigned' || order.status === 'in-transit') {
      await dbHelpers.update('carOrders', order._id, {
        status: 'delivered'
      });
    }
  }

  // Update train status to Completed
  await dbHelpers.update('trains', req.params.id, {
    status: 'Completed',
    updatedAt: new Date().toISOString()
  });

  const updatedTrain = await dbHelpers.findById('trains', req.params.id);

  res.json(ApiResponse.success(updatedTrain, 'Train completed successfully'));
}));

// POST /api/trains/:id/cancel - Cancel train
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const train = await dbHelpers.findById('trains', req.params.id);
  if (!train) {
    throw new ApiError('Train not found', 404);
  }

  // Cannot cancel completed trains
  if (train.status === 'Completed') {
    throw new ApiError('Cannot cancel completed train', 400, 'Completed trains cannot be cancelled');
  }

  // If train is In Progress, revert car orders
  if (train.status === 'In Progress') {
    const carOrders = await dbHelpers.findByQuery('carOrders', { assignedTrainId: req.params.id });
    for (const order of carOrders) {
      if (order.status === 'assigned' || order.status === 'in-transit') {
        await dbHelpers.update('carOrders', order._id, {
          status: 'pending',
          assignedCarId: null,
          assignedTrainId: null
        });
      }
    }
  }

  // Update train status to Cancelled
  await dbHelpers.update('trains', req.params.id, {
    status: 'Cancelled',
    updatedAt: new Date().toISOString()
  });

  const updatedTrain = await dbHelpers.findById('trains', req.params.id);

  res.json(ApiResponse.success(updatedTrain, 'Train cancelled successfully'));
}));

// Switch List Generation Algorithm
async function generateSwitchList(train, route) {
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

export default router;
