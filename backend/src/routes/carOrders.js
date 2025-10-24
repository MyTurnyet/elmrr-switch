import express from 'express';
import { dbHelpers } from '../database/index.js';
import { 
  validateCarOrder, 
  validateOrderGeneration,
  createOrderGenerationSummary,
  validateCarAssignment,
  checkDuplicateOrder,
  validateStatusTransition
} from '../models/carOrder.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// GET /api/car-orders - List all orders with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { industryId, status, sessionNumber, aarTypeId, search } = req.query;
  let query = {};

  if (industryId) query.industryId = industryId;
  if (status) query.status = status;
  if (sessionNumber) query.sessionNumber = parseInt(sessionNumber);
  if (aarTypeId) query.aarTypeId = aarTypeId;

  let carOrders = await dbHelpers.findByQuery('carOrders', query);

  // Apply search filter if provided (search in industry names)
  if (search) {
    const industries = await dbHelpers.findAll('industries');
    const industryMap = industries.reduce((map, industry) => {
      map[industry._id] = industry.name.toLowerCase();
      return map;
    }, {});

    const searchLower = search.toLowerCase();
    carOrders = carOrders.filter(order => {
      const industryName = industryMap[order.industryId] || '';
      return industryName.includes(searchLower) || 
             order.aarTypeId.toLowerCase().includes(searchLower);
    });
  }

  // Sort by creation date (newest first)
  carOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(ApiResponse.success(carOrders, 'Car orders retrieved successfully'));
}));

// GET /api/car-orders/:id - Get single order
router.get('/:id', asyncHandler(async (req, res) => {
  const carOrder = await dbHelpers.findById('carOrders', req.params.id);
  if (!carOrder) {
    throw new ApiError('Car order not found', 404);
  }

  // Enrich with related data
  const industry = await dbHelpers.findById('industries', carOrder.industryId);
  const enrichedOrder = {
    ...carOrder,
    industry: industry ? { _id: industry._id, name: industry.name } : null
  };

  if (carOrder.assignedCarId) {
    const car = await dbHelpers.findById('cars', carOrder.assignedCarId);
    enrichedOrder.assignedCar = car ? {
      _id: car._id,
      reportingMarks: car.reportingMarks,
      reportingNumber: car.reportingNumber
    } : null;
  }

  if (carOrder.assignedTrainId) {
    const train = await dbHelpers.findById('trains', carOrder.assignedTrainId);
    enrichedOrder.assignedTrain = train ? {
      _id: train._id,
      name: train.name
    } : null;
  }

  res.json(ApiResponse.success(enrichedOrder, 'Car order retrieved successfully'));
}));

// POST /api/car-orders - Create new order (manual creation)
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = validateCarOrder(req.body);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Verify industry exists
  const industry = await dbHelpers.findById('industries', value.industryId);
  if (!industry) {
    throw new ApiError(`Industry with ID '${value.industryId}' does not exist`, 404);
  }

  // Verify AAR type exists
  const aarType = await dbHelpers.findById('aarTypes', value.aarTypeId);
  if (!aarType) {
    throw new ApiError(`AAR type with ID '${value.aarTypeId}' does not exist`, 404);
  }

  // Check for duplicate pending orders
  const existingOrders = await dbHelpers.findByQuery('carOrders', {
    industryId: value.industryId,
    aarTypeId: value.aarTypeId,
    sessionNumber: value.sessionNumber,
    status: 'pending'
  });

  if (existingOrders.length > 0) {
    throw new ApiError('A pending order for this industry, AAR type, and session already exists', 409);
  }

  const newOrder = await dbHelpers.create('carOrders', value);

  res.status(201).json(ApiResponse.success(newOrder, 'Car order created successfully', 201));
}));


// PUT /api/car-orders/:id - Update order (status, assigned car/train)
router.put('/:id', asyncHandler(async (req, res) => {
  const { error, value } = validateCarOrder(req.body, true); // Allow partial updates
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Check if order exists
  const existingOrder = await dbHelpers.findById('carOrders', req.params.id);
  if (!existingOrder) {
    throw new ApiError('Car order not found', 404);
  }

  // Validate status transition if status is being updated
  if (value.status && value.status !== existingOrder.status) {
    const transition = validateStatusTransition(existingOrder.status, value.status);
    if (!transition.valid) {
      throw new ApiError(`Cannot change status from '${existingOrder.status}' to '${value.status}'. Allowed transitions: ${transition.allowedTransitions.join(', ')}`, 400);
    }
  }

  // Validate car assignment if assignedCarId is being updated
  if (value.assignedCarId && value.assignedCarId !== existingOrder.assignedCarId) {
    const car = await dbHelpers.findById('cars', value.assignedCarId);
    const validation = validateCarAssignment(existingOrder, car);
    
    if (!validation.valid) {
      throw new ApiError('Invalid car assignment', 400, validation.errors);
    }
  }

  // Verify references if being updated
  if (value.industryId && value.industryId !== existingOrder.industryId) {
    const industry = await dbHelpers.findById('industries', value.industryId);
    if (!industry) {
      throw new ApiError(`Industry with ID '${value.industryId}' does not exist`, 404);
    }
  }

  if (value.aarTypeId && value.aarTypeId !== existingOrder.aarTypeId) {
    const aarType = await dbHelpers.findById('aarTypes', value.aarTypeId);
    if (!aarType) {
      throw new ApiError(`AAR type with ID '${value.aarTypeId}' does not exist`, 404);
    }
  }

  const updated = await dbHelpers.update('carOrders', req.params.id, value);
  if (updated === 0) {
    throw new ApiError('Car order not found', 404);
  }

  const carOrder = await dbHelpers.findById('carOrders', req.params.id);
  res.json(ApiResponse.success(carOrder, 'Car order updated successfully'));
}));

// DELETE /api/car-orders/:id - Delete order
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingOrder = await dbHelpers.findById('carOrders', req.params.id);
  if (!existingOrder) {
    throw new ApiError('Car order not found', 404);
  }

  // Prevent deletion of orders that are assigned to trains
  if (existingOrder.assignedTrainId) {
    throw new ApiError('Cannot delete car order that is assigned to a train', 409);
  }

  const deleted = await dbHelpers.delete('carOrders', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Car order not found', 404);
  }

  res.json(ApiResponse.success(null, 'Car order deleted successfully'));
}));

// POST /api/car-orders/generate - Generate orders for current session based on industry demand
router.post('/generate', asyncHandler(async (req, res) => {
  const { error, value } = validateOrderGeneration(req.body);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Get current session number if not provided
  let sessionNumber = value.sessionNumber;
  if (!sessionNumber) {
    const sessions = await dbHelpers.findAll('operatingSessions');
    const currentSession = sessions[0];
    if (!currentSession) {
      throw new ApiError('Cannot generate orders without an active operating session', 404);
    }
    sessionNumber = currentSession.currentSessionNumber;
  }

    // Get all industries with demand configuration
    const industries = await dbHelpers.findAll('industries');
    let industriesToProcess = industries.filter(industry => 
      industry.carDemandConfig && 
      industry.carDemandConfig.length > 0
    );

    // Filter by specific industries if requested
    if (value.industryIds && value.industryIds.length > 0) {
      industriesToProcess = industriesToProcess.filter(industry =>
        value.industryIds.includes(industry._id)
      );
    }

    const ordersToCreate = [];
    const processedIndustries = [];

    // Process each industry's demand configuration
    for (const industry of industriesToProcess) {
      for (const demandConfig of industry.carDemandConfig) {
        // Check if demand should be generated this session
        const shouldGenerate = (sessionNumber % demandConfig.frequency) === 0;
        
        if (shouldGenerate) {
          // Check for existing pending orders unless force is true
          if (!value.force) {
            const existingOrders = await dbHelpers.findByQuery('carOrders', {
              industryId: industry._id,
              aarTypeId: demandConfig.aarTypeId,
              sessionNumber: sessionNumber,
              status: 'pending'
            });

            if (existingOrders.length > 0) {
              continue; // Skip if orders already exist
            }
          }

          // Create orders based on carsPerSession
          for (let i = 0; i < demandConfig.carsPerSession; i++) {
            ordersToCreate.push({
              industryId: industry._id,
              aarTypeId: demandConfig.aarTypeId,
              sessionNumber: sessionNumber,
              status: 'pending',
              assignedCarId: null,
              assignedTrainId: null,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      if (industry.carDemandConfig.length > 0) {
        processedIndustries.push({
          industryId: industry._id,
          industryName: industry.name,
          demandConfigs: industry.carDemandConfig.length
        });
      }
    }

    // Create all orders
    const createdOrders = [];
    for (const orderData of ordersToCreate) {
      try {
        const newOrder = await dbHelpers.create('carOrders', orderData);
        createdOrders.push(newOrder);
      } catch (createError) {
        console.error('Failed to create order:', createError);
        // Continue with other orders
      }
    }

    const summary = createOrderGenerationSummary(createdOrders, processedIndustries);

  res.json(ApiResponse.success({
    sessionNumber,
    ordersGenerated: createdOrders.length,
    industriesProcessed: processedIndustries.length,
    summary,
    orders: createdOrders
  }, `Generated ${createdOrders.length} car orders for session ${sessionNumber}`));
}));

export default router;
