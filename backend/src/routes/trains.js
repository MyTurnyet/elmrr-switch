import express from 'express';
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

// GET /api/trains - List all trains with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { sessionNumber, status, routeId, search } = req.query;
  let query = {};

  if (sessionNumber) query.sessionNumber = parseInt(sessionNumber);
  if (status) query.status = status;
  if (routeId) query.routeId = routeId;

  let trains = await dbHelpers.findByQuery('trains', query);

  // Apply search filter if provided (search in train names)
  if (search) {
    const searchLower = search.toLowerCase();
    trains = trains.filter(train =>
      train.name.toLowerCase().includes(searchLower)
    );
  }

  // Sort by creation date (newest first)
  trains.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(ApiResponse.success(trains, 'Trains retrieved successfully'));
}));

// GET /api/trains/:id - Get single train with full switch list
router.get('/:id', asyncHandler(async (req, res) => {
  const train = await dbHelpers.findById('trains', req.params.id);
  if (!train) {
    throw new ApiError('Train not found', 404);
  }

    // Enrich with related data
    const route = await dbHelpers.findById('routes', train.routeId);
    const locomotives = await Promise.all(
      train.locomotiveIds.map(id => dbHelpers.findById('locomotives', id))
    );

    const enrichedTrain = {
      ...train,
      route: route ? { _id: route._id, name: route.name } : null,
      locomotives: locomotives.filter(Boolean).map(loco => ({
        _id: loco._id,
        reportingMarks: loco.reportingMarks,
        reportingNumber: loco.reportingNumber,
        type: loco.type
      }))
    };

  res.json(ApiResponse.success(enrichedTrain, 'Train retrieved successfully'));
}));

// POST /api/trains - Create new train (status: Planned)
router.post('/', asyncHandler(async (req, res) => {
  // Get current session number if not provided
  let sessionNumber = req.body.sessionNumber;
  if (!sessionNumber) {
    const sessions = await dbHelpers.findAll('operatingSessions');
    const currentSession = sessions[0];
    if (!currentSession) {
      throw new ApiError('Cannot create train without an active operating session', 404);
    }
    sessionNumber = currentSession.currentSessionNumber;
  }

  const trainData = { ...req.body, sessionNumber, status: 'Planned' };
  const { error, value } = validateTrain(trainData);
  
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Verify route exists
  const route = await dbHelpers.findById('routes', value.routeId);
  if (!route) {
    throw new ApiError(`Route with ID '${value.routeId}' does not exist`, 404);
  }

    // Verify all locomotives exist and are in service
    const locomotives = [];
    for (const locoId of value.locomotiveIds) {
      const locomotive = await dbHelpers.findById('locomotives', locoId);
      if (!locomotive) {
        throw new ApiError(`Locomotive with ID '${locoId}' does not exist`, 404);
      }
      if (!locomotive.isInService) {
        throw new ApiError(`Locomotive '${locomotive.reportingMarks}' is not in service`, 400);
      }
      locomotives.push(locomotive);
    }

  // Check train name uniqueness within session
  const allTrains = await dbHelpers.findAll('trains');
  const nameValidation = validateTrainNameUniqueness(allTrains, value.name, value.sessionNumber);
  if (!nameValidation.valid) {
    throw new ApiError(`A train named '${value.name}' already exists in session ${value.sessionNumber}`, 409);
  }

  // Check locomotive assignment conflicts
  const locoValidation = validateLocomotiveAssignments(allTrains, value.locomotiveIds);
  if (!locoValidation.valid) {
    const conflicts = locoValidation.conflicts.map(c => 
      `Locomotive ${c.locomotiveId} is assigned to train '${c.conflictingTrains[0].name}'`
    ).join(', ');
    throw new ApiError('Locomotive assignment conflict', 409, [conflicts]);
  }

  const newTrain = await dbHelpers.create('trains', value);

  res.status(201).json(ApiResponse.success(newTrain, 'Train created successfully', 201));
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
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    // Only allow updates if train is in Planned status
    if (existingTrain.status !== 'Planned') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update train',
        message: `Cannot update train with status: ${existingTrain.status}. Only 'Planned' trains can be updated.`
      });
    }

    // Verify route if being updated
    if (value.routeId && value.routeId !== existingTrain.routeId) {
      const route = await dbHelpers.findById('routes', value.routeId);
      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Route not found',
          message: `Route with ID '${value.routeId}' does not exist`
        });
      }
    }

    // Verify locomotives if being updated
    if (value.locomotiveIds) {
      for (const locoId of value.locomotiveIds) {
        const locomotive = await dbHelpers.findById('locomotives', locoId);
        if (!locomotive) {
          return res.status(404).json({
            success: false,
            error: 'Locomotive not found',
            message: `Locomotive with ID '${locoId}' does not exist`
          });
        }
        if (!locomotive.isInService) {
          return res.status(400).json({
            success: false,
            error: 'Locomotive out of service',
            message: `Locomotive '${locomotive.reportingMarks}' is not in service`
          });
        }
      }

      // Check locomotive assignment conflicts
      const allTrains = await dbHelpers.findAll('trains');
      const locoValidation = validateLocomotiveAssignments(allTrains, value.locomotiveIds, req.params.id);
      if (!locoValidation.valid) {
        const conflicts = locoValidation.conflicts.map(c => 
          `Locomotive ${c.locomotiveId} is assigned to train '${c.conflictingTrains[0].name}'`
        ).join(', ');
        return res.status(409).json({
          success: false,
          error: 'Locomotive assignment conflict',
          message: conflicts
        });
      }
    }

    // Check train name uniqueness if being updated
    if (value.name && value.name !== existingTrain.name) {
      const allTrains = await dbHelpers.findAll('trains');
      const nameValidation = validateTrainNameUniqueness(allTrains, value.name, existingTrain.sessionNumber, req.params.id);
      if (!nameValidation.valid) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate train name',
          message: `A train named '${value.name}' already exists in session ${existingTrain.sessionNumber}`
        });
      }
    }

    // Add updatedAt timestamp
    value.updatedAt = new Date().toISOString();

    const updated = await dbHelpers.update('trains', req.params.id, value);
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    const train = await dbHelpers.findById('trains', req.params.id);
    res.json({
      success: true,
      data: train,
      message: 'Train updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update train',
      message: error.message
    });
  }
});

// DELETE /api/trains/:id - Delete train (only if status=Planned)
router.delete('/:id', async (req, res) => {
  try {
    const existingTrain = await dbHelpers.findById('trains', req.params.id);
    if (!existingTrain) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    // Only allow deletion if train is in Planned status
    if (existingTrain.status !== 'Planned') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete train',
        message: `Cannot delete train with status: ${existingTrain.status}. Only 'Planned' trains can be deleted.`
      });
    }

    const deleted = await dbHelpers.delete('trains', req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    res.json({
      success: true,
      message: 'Train deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete train',
      message: error.message
    });
  }
});

// POST /api/trains/:id/generate-switch-list - Generate switch list (status: Planned → In Progress)
router.post('/:id/generate-switch-list', async (req, res) => {
  try {
    const train = await dbHelpers.findById('trains', req.params.id);
    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    // Get route and locomotives
    const route = await dbHelpers.findById('routes', train.routeId);
    const locomotives = await Promise.all(
      train.locomotiveIds.map(id => dbHelpers.findById('locomotives', id))
    );

    // Validate requirements
    const validation = validateSwitchListRequirements(train, route, locomotives.filter(Boolean));
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate switch list',
        message: validation.errors.join(', ')
      });
    }

    // Generate switch list using the algorithm
    const switchListResult = await generateSwitchList(train, route);
    
    if (!switchListResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Switch list generation failed',
        message: switchListResult.message
      });
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

    res.json({
      success: true,
      data: updatedTrain,
      message: 'Switch list generated successfully',
      stats: {
        stationsServed: switchListResult.switchList.stations.length,
        totalPickups: switchListResult.switchList.totalPickups,
        totalSetouts: switchListResult.switchList.totalSetouts,
        finalCarCount: switchListResult.switchList.finalCarCount,
        carOrdersFulfilled: switchListResult.carOrderUpdates.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate switch list',
      message: error.message
    });
  }
});

// POST /api/trains/:id/complete - Mark train as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const train = await dbHelpers.findById('trains', req.params.id);
    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    if (train.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        error: 'Invalid train status',
        message: `Cannot complete train with status: ${train.status}. Only 'In Progress' trains can be completed.`
      });
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

    res.json({
      success: true,
      data: updatedTrain,
      message: 'Train completed successfully',
      stats: {
        carsMoved: carUpdates.length,
        ordersDelivered: carOrders.filter(o => o.status === 'assigned' || o.status === 'in-transit').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete train',
      message: error.message
    });
  }
});

// POST /api/trains/:id/cancel - Cancel train
router.post('/:id/cancel', async (req, res) => {
  try {
    const train = await dbHelpers.findById('trains', req.params.id);
    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    // Cannot cancel completed trains
    if (train.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed train',
        message: 'Completed trains cannot be cancelled'
      });
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

    res.json({
      success: true,
      data: updatedTrain,
      message: 'Train cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel train',
      message: error.message
    });
  }
});

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
