import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateRoute } from '../models/route.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// GET /api/routes - Get all routes with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { originYard, terminationYard, search } = req.query;
  let query = {};

  if (originYard) query.originYard = originYard;
  if (terminationYard) query.terminationYard = terminationYard;

  let routes = await dbHelpers.findByQuery('routes', query);

  // Apply search filter if provided (name or description)
  if (search) {
    const searchLower = search.toLowerCase();
    routes = routes.filter(route =>
      route.name.toLowerCase().includes(searchLower) ||
      (route.description && route.description.toLowerCase().includes(searchLower))
    );
  }

  res.json(ApiResponse.success(routes, 'Routes retrieved successfully'));
}));

// GET /api/routes/:id - Get route by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const route = await dbHelpers.findById('routes', req.params.id);
  if (!route) {
    throw new ApiError('Route not found', 404);
  }
  res.json(ApiResponse.success(route, 'Route retrieved successfully'));
}));

// POST /api/routes - Create new route
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateRoute(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Check for duplicate route name
    const existing = await dbHelpers.findByQuery('routes', {
      name: value.name
    });

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate route name',
        message: 'A route with this name already exists'
      });
    }

    // Verify origin yard exists and is a yard
    const originYard = await dbHelpers.findById('industries', value.originYard);
    if (!originYard) {
      return res.status(404).json({
        success: false,
        error: 'Origin yard not found',
        message: `Industry with ID '${value.originYard}' does not exist`
      });
    }
    if (!originYard.isYard) {
      return res.status(400).json({
        success: false,
        error: 'Invalid origin yard',
        message: 'Origin must be an industry with isYard=true'
      });
    }

    // Verify termination yard exists and is a yard
    const terminationYard = await dbHelpers.findById('industries', value.terminationYard);
    if (!terminationYard) {
      return res.status(404).json({
        success: false,
        error: 'Termination yard not found',
        message: `Industry with ID '${value.terminationYard}' does not exist`
      });
    }
    if (!terminationYard.isYard) {
      return res.status(400).json({
        success: false,
        error: 'Invalid termination yard',
        message: 'Termination must be an industry with isYard=true'
      });
    }

    // Verify all stations in sequence exist
    if (value.stationSequence && value.stationSequence.length > 0) {
      for (const stationId of value.stationSequence) {
        const station = await dbHelpers.findById('stations', stationId);
        if (!station) {
          return res.status(404).json({
            success: false,
            error: 'Station not found',
            message: `Station with ID '${stationId}' does not exist`
          });
        }
      }
    }

    const newRoute = await dbHelpers.create('routes', value);

    res.status(201).json({
      success: true,
      data: newRoute,
      message: 'Route created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create route',
      message: error.message
    });
  }
});

// PUT /api/routes/:id - Update route
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = validateRoute(req.body, true); // Allow partial updates
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Check if route exists
    const existingRoute = await dbHelpers.findById('routes', req.params.id);
    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Check for duplicate route name (if name is being updated)
    if (value.name && value.name !== existingRoute.name) {
      const duplicate = await dbHelpers.findByQuery('routes', {
        name: value.name
      });

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate route name',
          message: 'A route with this name already exists'
        });
      }
    }

    // Verify origin yard if being updated
    if (value.originYard) {
      const originYard = await dbHelpers.findById('industries', value.originYard);
      if (!originYard) {
        return res.status(404).json({
          success: false,
          error: 'Origin yard not found',
          message: `Industry with ID '${value.originYard}' does not exist`
        });
      }
      if (!originYard.isYard) {
        return res.status(400).json({
          success: false,
          error: 'Invalid origin yard',
          message: 'Origin must be an industry with isYard=true'
        });
      }
    }

    // Verify termination yard if being updated
    if (value.terminationYard) {
      const terminationYard = await dbHelpers.findById('industries', value.terminationYard);
      if (!terminationYard) {
        return res.status(404).json({
          success: false,
          error: 'Termination yard not found',
          message: `Industry with ID '${value.terminationYard}' does not exist`
        });
      }
      if (!terminationYard.isYard) {
        return res.status(400).json({
          success: false,
          error: 'Invalid termination yard',
          message: 'Termination must be an industry with isYard=true'
        });
      }
    }

    // Verify all stations in sequence exist (if being updated)
    if (value.stationSequence && value.stationSequence.length > 0) {
      for (const stationId of value.stationSequence) {
        const station = await dbHelpers.findById('stations', stationId);
        if (!station) {
          return res.status(404).json({
            success: false,
            error: 'Station not found',
            message: `Station with ID '${stationId}' does not exist`
          });
        }
      }
    }

    const updated = await dbHelpers.update('routes', req.params.id, value);
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    const route = await dbHelpers.findById('routes', req.params.id);
    res.json({
      success: true,
      data: route,
      message: 'Route updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update route',
      message: error.message
    });
  }
});

// DELETE /api/routes/:id - Delete route
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Phase 2.2 - Check if route is in use by active trains
    // const trains = await dbHelpers.findByQuery('trains', { route: req.params.id });
    // if (trains.length > 0) {
    //   return res.status(409).json({
    //     success: false,
    //     error: 'Route in use',
    //     message: 'Cannot delete route that is assigned to active trains'
    //   });
    // }

    const deleted = await dbHelpers.delete('routes', req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete route',
      message: error.message
    });
  }
});

export default router;
