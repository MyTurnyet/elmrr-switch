import express, { Router } from 'express';
import { dbHelpers } from '../database/index.js';
import { validateRoute } from '../models/route.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import type { TypedRequest, IdParam, StandardQuery } from '../types/index.js';
const router: Router = express.Router();

// GET /api/routes - Get all routes with optional filtering
router.get('/', asyncHandler(async (req: TypedRequest<{}, {}, StandardQuery>, res) => {
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
router.get('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const route = await dbHelpers.findById('routes', req.params.id);
  if (!route) {
    throw new ApiError('Route not found', 404);
  }
  res.json(ApiResponse.success(route, 'Route retrieved successfully'));
}));

// POST /api/routes - Create new route
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = validateRoute(req.body);
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

  // Check for duplicate route name
  const existing = await dbHelpers.findByQuery('routes', {
    name: value.name
  });

  if (existing.length > 0) {
    throw new ApiError('A route with this name already exists', 409);
  }

  // Verify origin yard exists and is a yard
  const originYard = await dbHelpers.findById('industries', value.originYard);
  if (!originYard) {
    throw new ApiError(`Industry with ID '${value.originYard}' does not exist`, 404);
  }
  if (!originYard.isYard) {
    throw new ApiError('Origin must be an industry with isYard=true', 400);
  }

  // Verify termination yard exists and is a yard
  const terminationYard = await dbHelpers.findById('industries', value.terminationYard);
  if (!terminationYard) {
    throw new ApiError(`Industry with ID '${value.terminationYard}' does not exist`, 404);
  }
  if (!terminationYard.isYard) {
    throw new ApiError('Termination must be an industry with isYard=true', 400);
  }

  // Verify all stations in sequence exist
  if (value.stationSequence && value.stationSequence.length > 0) {
    for (const stationId of value.stationSequence) {
      const station = await dbHelpers.findById('stations', stationId);
      if (!station) {
        throw new ApiError(`Station with ID '${stationId}' does not exist`, 404);
      }
    }
  }

  const newRoute = await dbHelpers.create('routes', value);

  res.status(201).json(ApiResponse.success(newRoute, 'Route created successfully', 201));
}));

// PUT /api/routes/:id - Update route
router.put('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  const { error, value } = validateRoute(req.body, true); // Allow partial updates
  if (error) {
    throw new ApiError('Validation failed', 400, error.details.map(d => d.message));
  }

    // Check if route exists
    const existingRoute = await dbHelpers.findById('routes', req.params.id);
    if (!existingRoute) {
      throw new ApiError('Route not found', 404);
    }

    // Check for duplicate route name (if name is being updated)
    if (value.name && value.name !== existingRoute.name) {
      const duplicate = await dbHelpers.findByQuery('routes', {
        name: value.name
      });

      if (duplicate.length > 0) {
        throw new ApiError('A route with this name already exists', 409);
      }
    }

    // Verify origin yard if being updated
    if (value.originYard) {
      const originYard = await dbHelpers.findById('industries', value.originYard);
      if (!originYard) {
        throw new ApiError(`Industry with ID '${value.originYard}' does not exist`, 404);
      }
      if (!originYard.isYard) {
        throw new ApiError('Origin must be an industry with isYard=true', 400);
      }
    }

    // Verify termination yard if being updated
    if (value.terminationYard) {
      const terminationYard = await dbHelpers.findById('industries', value.terminationYard);
      if (!terminationYard) {
        throw new ApiError(`Industry with ID '${value.terminationYard}' does not exist`, 404);
      }
      if (!terminationYard.isYard) {
        throw new ApiError('Termination must be an industry with isYard=true', 400);
      }
    }

    // Verify all stations in sequence exist (if being updated)
    if (value.stationSequence && value.stationSequence.length > 0) {
      for (const stationId of value.stationSequence) {
        const station = await dbHelpers.findById('stations', stationId);
        if (!station) {
          throw new ApiError(`Station with ID '${stationId}' does not exist`, 404);
        }
      }
    }

    const updated = await dbHelpers.update('routes', req.params.id, value);
    if (updated === 0) {
      throw new ApiError('Route not found', 404);
    }

    const route = await dbHelpers.findById('routes', req.params.id);
    res.json(ApiResponse.success(route, 'Route updated successfully'));
}));

// DELETE /api/routes/:id - Delete route
router.delete('/:id', asyncHandler(async (req: TypedRequest<IdParam>, res) => {
  // TODO: Phase 2.2 - Check if route is in use by active trains
  // const trains = await dbHelpers.findByQuery('trains', { route: req.params.id });
  // if (trains.length > 0) {
  //   throw new ApiError('Cannot delete route that is assigned to active trains', 409);
  // }

  const deleted = await dbHelpers.delete('routes', req.params.id);
  if (deleted === 0) {
    throw new ApiError('Route not found', 404);
  }

  res.json(ApiResponse.success(null, 'Route deleted successfully'));
}));

export default router;
