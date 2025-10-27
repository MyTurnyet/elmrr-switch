import express, { Router } from 'express';
import multer from 'multer';
import { dbHelpers } from '../database/index.js';
import { validateCar } from '../models/car.js';
import { validateIndustry } from '../models/industry.js';
import { validateRoute } from '../models/route.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/import/json - Import JSON data
router.post('/json', upload.single('file'), asyncHandler(async (req, res) => {
  let data;
  
  if (req.file) {
    // File upload
    data = JSON.parse(req.file.buffer.toString());
  } else if (req.body.data) {
    // Direct JSON data
    data = req.body.data;
  } else {
    throw new ApiError('Please provide either a file or JSON data', 400);
  }

    const results: { imported: number; errors: string[]; warnings?: string[] } = {
      imported: 0,
      errors: [],
      warnings: []
    };

    // Import in dependency order:
    // 1. Reference data (blocks, stations, goods, aarTypes)
    // 2. Industries (depend on stations)
    // 3. Tracks (depend on industries)
    // 4. Routes (depend on industries and stations)
    // 5. Rolling stock (cars, locomotives - depend on industries)
    // 6. Trains (depend on routes and locomotives) - Phase 2.2

    // Step 1: Import reference data first
    const referenceTypes = ['blocks', 'stations', 'goods', 'aarTypes'];

    for (const entityType of referenceTypes) {
      if (data[entityType] && Array.isArray(data[entityType])) {
        for (const [index, entityData] of data[entityType].entries()) {
          try {
            // Preserve _id if provided in seed data
            await dbHelpers.create(entityType as any, entityData);
            results.imported++;
          } catch (err) {
            results.errors.push(`${entityType} ${index + 1}: ${(err as Error).message}`);
          }
        }
      }
    }

    // Step 2: Import industries (which reference stations)
    if (data.industries && Array.isArray(data.industries)) {
      for (const [index, industryData] of data.industries.entries()) {
        try {
          const { error, value } = validateIndustry(industryData);
          if (error) {
            results.errors.push(`Industry ${index + 1}: ${error.details[0].message}`);
            continue;
          }

          // Preserve _id if provided in seed data
          await dbHelpers.create('industries' as any, value);
          results.imported++;
        } catch (err) {
          results.errors.push(`Industry ${index + 1}: ${(err as Error).message}`);
        }
      }
    }

    // Step 3: Import tracks (which reference industries)
    const trackTypes = ['tracks'];

    for (const entityType of trackTypes) {
      if (data[entityType] && Array.isArray(data[entityType])) {
        for (const [index, entityData] of data[entityType].entries()) {
          try {
            await dbHelpers.create(entityType as any, entityData);
            results.imported++;
          } catch (err) {
            results.errors.push(`${entityType} ${index + 1}: ${(err as Error).message}`);
          }
        }
      }
    }

    // Step 4: Import routes (which reference industries and stations)
    if (data.routes && Array.isArray(data.routes)) {
      for (const [index, routeData] of data.routes.entries()) {
        try {
          const { error, value } = validateRoute(routeData);
          if (error) {
            results.errors.push(`Route ${index + 1}: ${error.details[0].message}`);
            continue;
          }

          // Verify origin yard exists and is a yard
          const originYard = await dbHelpers.findById('industries', value.originYard);
          if (!originYard) {
            results.errors.push(`Route ${index + 1}: Origin yard '${value.originYard}' not found`);
            continue;
          }
          if (!originYard.isYard) {
            results.errors.push(`Route ${index + 1}: Origin '${value.originYard}' is not a yard`);
            continue;
          }

          // Verify termination yard exists and is a yard
          const terminationYard = await dbHelpers.findById('industries', value.terminationYard);
          if (!terminationYard) {
            results.errors.push(`Route ${index + 1}: Termination yard '${value.terminationYard}' not found`);
            continue;
          }
          if (!terminationYard.isYard) {
            results.errors.push(`Route ${index + 1}: Termination '${value.terminationYard}' is not a yard`);
            continue;
          }

          // Verify all stations in sequence exist
          if (value.stationSequence && value.stationSequence.length > 0) {
            let stationsValid = true;
            for (const stationId of value.stationSequence) {
              const station = await dbHelpers.findById('stations', stationId);
              if (!station) {
                results.errors.push(`Route ${index + 1}: Station '${stationId}' not found in sequence`);
                stationsValid = false;
                break;
              }
            }
            if (!stationsValid) continue;
          }

          // Check for duplicate route names
          const existing = await dbHelpers.findByQuery('routes', {
            name: value.name
          });

          if (existing.length > 0) {
            results.warnings!.push(`Route ${index + 1}: Duplicate route name '${value.name}'`);
            continue;
          }

          // Preserve _id if provided in seed data
          await dbHelpers.create('routes', value);
          results.imported++;
        } catch (err) {
          results.errors.push(`Route ${index + 1}: ${(err as Error).message}`);
        }
      }
    }

    // Step 5: Import rolling stock (cars and locomotives - depend on industries)
    if (data.cars && Array.isArray(data.cars)) {
      for (const [index, carData] of data.cars.entries()) {
        try {
          const { error, value } = validateCar(carData);
          if (error) {
            results.errors.push(`Car ${index + 1}: ${error.details[0].message}`);
            continue;
          }

          // Check for duplicates
          const existing = await dbHelpers.findByQuery('cars', {
            reportingMarks: value.reportingMarks,
            reportingNumber: value.reportingNumber
          });

          if (existing.length > 0) {
            results.warnings!.push(`Car ${index + 1}: Duplicate reporting marks ${value.reportingMarks} ${value.reportingNumber}`);
            continue;
          }

          await dbHelpers.create('cars', {
            ...value,
            sessionsAtCurrentLocation: value.sessionsAtCurrentLocation || 0,
            lastMoved: value.lastMoved ? new Date(value.lastMoved) : new Date()
          });

          results.imported++;
        } catch (err) {
          results.errors.push(`Car ${index + 1}: ${(err as Error).message}`);
        }
      }
    }

    // Import locomotives
    const locomotiveTypes = ['locomotives'];

    for (const entityType of locomotiveTypes) {
      if (data[entityType] && Array.isArray(data[entityType])) {
        for (const [index, entityData] of data[entityType].entries()) {
          try {
            await dbHelpers.create(entityType as any, entityData);
            results.imported++;
          } catch (err) {
            results.errors.push(`${entityType} ${index + 1}: ${(err as Error).message}`);
          }
        }
      }
    }

  res.json(ApiResponse.success(results, `Import completed: ${results.imported} records imported, ${results.errors.length} errors, ${results.warnings!.length} warnings`));
}));

// GET /api/import/export - Export all data to JSON
router.get('/export', asyncHandler(async (_req, res) => {
  const exportData: Record<string, any> = {};
  const collections = ['cars', 'locomotives', 'industries', 'stations', 'goods', 'aarTypes', 'blocks', 'tracks', 'routes', 'operatingSessions', 'carOrders'];

  for (const collection of collections) {
    exportData[collection] = await dbHelpers.findAll(collection as any);
  }

  const responseData = {
    ...exportData,
    exportedAt: new Date().toISOString()
  };

  res.json(ApiResponse.success(responseData, 'Data exported successfully'));
}));

// POST /api/import/clear - Clear all data (for testing)
router.post('/clear', asyncHandler(async (_req, res) => {
  const collections = ['cars', 'locomotives', 'industries', 'stations', 'goods', 'aarTypes', 'blocks', 'tracks', 'routes', 'operatingSessions', 'carOrders'];
  let totalCleared = 0;

  for (const collectionName of collections) {
    const cleared = await dbHelpers.clearCollection(collectionName as any);
    totalCleared += cleared;
  }

  res.json(ApiResponse.success({ totalCleared }, `Cleared ${totalCleared} records from database`));
}));

export default router;
