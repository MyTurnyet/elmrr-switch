import express from 'express';
import multer from 'multer';
import { dbHelpers } from '../database/index.js';
import { validateCar } from '../models/car.js';
import { validateIndustry } from '../models/industry.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/import/json - Import JSON data
router.post('/json', upload.single('file'), async (req, res) => {
  try {
    let data;
    
    if (req.file) {
      // File upload
      data = JSON.parse(req.file.buffer.toString());
    } else if (req.body.data) {
      // Direct JSON data
      data = req.body.data;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        message: 'Please provide either a file or JSON data'
      });
    }

    const results = {
      imported: 0,
      errors: [],
      warnings: []
    };

    // Import cars
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
            results.warnings.push(`Car ${index + 1}: Duplicate reporting marks ${value.reportingMarks} ${value.reportingNumber}`);
            continue;
          }

          await dbHelpers.create('cars', {
            ...value,
            sessionsAtCurrentLocation: value.sessionsAtCurrentLocation || 0,
            lastMoved: value.lastMoved ? new Date(value.lastMoved) : new Date()
          });
          
          results.imported++;
        } catch (err) {
          results.errors.push(`Car ${index + 1}: ${err.message}`);
        }
      }
    }

    // Import industries
    if (data.industries && Array.isArray(data.industries)) {
      for (const [index, industryData] of data.industries.entries()) {
        try {
          const { error, value } = validateIndustry(industryData);
          if (error) {
            results.errors.push(`Industry ${index + 1}: ${error.details[0].message}`);
            continue;
          }

          await dbHelpers.create('industries', value);
          results.imported++;
        } catch (err) {
          results.errors.push(`Industry ${index + 1}: ${err.message}`);
        }
      }
    }

    // Import other entities (stations, goods, aarTypes, etc.)
    const entityTypes = ['stations', 'goods', 'aarTypes', 'blocks', 'tracks', 'locomotives'];
    
    for (const entityType of entityTypes) {
      if (data[entityType] && Array.isArray(data[entityType])) {
        for (const [index, entityData] of data[entityType].entries()) {
          try {
            await dbHelpers.create(entityType, entityData);
            results.imported++;
          } catch (err) {
            results.errors.push(`${entityType} ${index + 1}: ${err.message}`);
          }
        }
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.imported} records imported, ${results.errors.length} errors, ${results.warnings.length} warnings`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

// GET /api/import/export - Export all data to JSON
router.get('/export', async (req, res) => {
  try {
    const exportData = {};
    const collections = ['cars', 'locomotives', 'industries', 'stations', 'goods', 'aarTypes', 'blocks', 'tracks'];
    
    for (const collection of collections) {
      exportData[collection] = await dbHelpers.findAll(collection);
    }

    res.json({
      success: true,
      data: exportData,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
});

// POST /api/import/clear - Clear all data (for testing)
router.post('/clear', async (req, res) => {
  try {
    const collections = ['cars', 'locomotives', 'industries', 'stations', 'goods', 'aarTypes', 'blocks', 'tracks'];
    let totalCleared = 0;

    for (const collection of collections) {
      const cleared = await dbHelpers.clearCollection(collection);
      totalCleared += cleared;
    }

    res.json({
      success: true,
      message: `Cleared ${totalCleared} records from database`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Clear operation failed',
      message: error.message
    });
  }
});

export default router;
