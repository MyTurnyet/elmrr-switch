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
router.get('/:id', async (req, res) => {
  try {
    const carOrder = await dbHelpers.findById('carOrders', req.params.id);
    if (!carOrder) {
      return res.status(404).json({
        success: false,
        error: 'Car order not found'
      });
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

    res.json({
      success: true,
      data: enrichedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch car order',
      message: error.message
    });
  }
});

// POST /api/car-orders - Create new order (manual creation)
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateCarOrder(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Verify industry exists
    const industry = await dbHelpers.findById('industries', value.industryId);
    if (!industry) {
      return res.status(404).json({
        success: false,
        error: 'Industry not found',
        message: `Industry with ID '${value.industryId}' does not exist`
      });
    }

    // Verify AAR type exists
    const aarType = await dbHelpers.findById('aarTypes', value.aarTypeId);
    if (!aarType) {
      return res.status(404).json({
        success: false,
        error: 'AAR type not found',
        message: `AAR type with ID '${value.aarTypeId}' does not exist`
      });
    }

    // Check for duplicate pending orders
    const existingOrders = await dbHelpers.findByQuery('carOrders', {
      industryId: value.industryId,
      aarTypeId: value.aarTypeId,
      sessionNumber: value.sessionNumber,
      status: 'pending'
    });

    if (existingOrders.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate order',
        message: 'A pending order for this industry, AAR type, and session already exists'
      });
    }

    const newOrder = await dbHelpers.create('carOrders', value);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Car order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create car order',
      message: error.message
    });
  }
});

// PUT /api/car-orders/:id - Update order (status, assigned car/train)
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = validateCarOrder(req.body, true); // Allow partial updates
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Check if order exists
    const existingOrder = await dbHelpers.findById('carOrders', req.params.id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Car order not found'
      });
    }

    // Validate status transition if status is being updated
    if (value.status && value.status !== existingOrder.status) {
      const transition = validateStatusTransition(existingOrder.status, value.status);
      if (!transition.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status transition',
          message: `Cannot change status from '${existingOrder.status}' to '${value.status}'. Allowed transitions: ${transition.allowedTransitions.join(', ')}`
        });
      }
    }

    // Validate car assignment if assignedCarId is being updated
    if (value.assignedCarId && value.assignedCarId !== existingOrder.assignedCarId) {
      const car = await dbHelpers.findById('cars', value.assignedCarId);
      const validation = validateCarAssignment(existingOrder, car);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid car assignment',
          message: validation.errors.join(', ')
        });
      }
    }

    // Verify references if being updated
    if (value.industryId && value.industryId !== existingOrder.industryId) {
      const industry = await dbHelpers.findById('industries', value.industryId);
      if (!industry) {
        return res.status(404).json({
          success: false,
          error: 'Industry not found',
          message: `Industry with ID '${value.industryId}' does not exist`
        });
      }
    }

    if (value.aarTypeId && value.aarTypeId !== existingOrder.aarTypeId) {
      const aarType = await dbHelpers.findById('aarTypes', value.aarTypeId);
      if (!aarType) {
        return res.status(404).json({
          success: false,
          error: 'AAR type not found',
          message: `AAR type with ID '${value.aarTypeId}' does not exist`
        });
      }
    }

    const updated = await dbHelpers.update('carOrders', req.params.id, value);
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car order not found'
      });
    }

    const carOrder = await dbHelpers.findById('carOrders', req.params.id);
    res.json({
      success: true,
      data: carOrder,
      message: 'Car order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update car order',
      message: error.message
    });
  }
});

// DELETE /api/car-orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const existingOrder = await dbHelpers.findById('carOrders', req.params.id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Car order not found'
      });
    }

    // Prevent deletion of orders that are assigned to trains
    if (existingOrder.assignedTrainId) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete assigned order',
        message: 'Cannot delete car order that is assigned to a train'
      });
    }

    const deleted = await dbHelpers.delete('carOrders', req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car order not found'
      });
    }

    res.json({
      success: true,
      message: 'Car order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete car order',
      message: error.message
    });
  }
});

// POST /api/car-orders/generate - Generate orders for current session based on industry demand
router.post('/generate', async (req, res) => {
  try {
    const { error, value } = validateOrderGeneration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Get current session number if not provided
    let sessionNumber = value.sessionNumber;
    if (!sessionNumber) {
      const sessions = await dbHelpers.findAll('operatingSessions');
      const currentSession = sessions[0];
      if (!currentSession) {
        return res.status(404).json({
          success: false,
          error: 'No current session found',
          message: 'Cannot generate orders without an active operating session'
        });
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

    res.json({
      success: true,
      data: {
        sessionNumber,
        ordersGenerated: createdOrders.length,
        industriesProcessed: processedIndustries.length,
        summary,
        orders: createdOrders
      },
      message: `Generated ${createdOrders.length} car orders for session ${sessionNumber}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate car orders',
      message: error.message
    });
  }
});

export default router;
