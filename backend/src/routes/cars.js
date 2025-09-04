import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateCar } from '../models/car.js';

const router = express.Router();

// GET /api/cars - Get all cars with optional filtering
router.get('/', async (req, res) => {
  try {
    const { carType, location, status, homeYard } = req.query;
    let query = {};
    
    if (carType) query.carType = carType;
    if (location) query.currentIndustry = location;
    if (status) query.isInService = status === 'true';
    if (homeYard) query.homeYard = homeYard;

    const cars = await dbHelpers.findByQuery('cars', query);
    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cars',
      message: error.message
    });
  }
});

// GET /api/cars/:id - Get car by ID
router.get('/:id', async (req, res) => {
  try {
    const car = await dbHelpers.findById('cars', req.params.id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }
    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch car',
      message: error.message
    });
  }
});

// POST /api/cars - Create new car
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateCar(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    // Check for duplicate reporting marks/number combination
    const existing = await dbHelpers.findByQuery('cars', {
      reportingMarks: value.reportingMarks,
      reportingNumber: value.reportingNumber
    });

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate car',
        message: 'Car with these reporting marks and number already exists'
      });
    }

    const newCar = await dbHelpers.create('cars', {
      ...value,
      sessionsAtCurrentLocation: 0,
      lastMoved: new Date()
    });

    res.status(201).json({
      success: true,
      data: newCar,
      message: 'Car created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create car',
      message: error.message
    });
  }
});

// PUT /api/cars/:id - Update car
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = validateCar(req.body, true); // Allow partial updates
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const updated = await dbHelpers.update('cars', req.params.id, value);
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const car = await dbHelpers.findById('cars', req.params.id);
    res.json({
      success: true,
      data: car,
      message: 'Car updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update car',
      message: error.message
    });
  }
});

// POST /api/cars/:id/move - Move car to different industry
router.post('/:id/move', async (req, res) => {
  try {
    const { destinationIndustryId } = req.body;
    if (!destinationIndustryId) {
      return res.status(400).json({
        success: false,
        error: 'Destination industry ID is required'
      });
    }

    // Verify destination industry exists
    const industry = await dbHelpers.findById('industries', destinationIndustryId);
    if (!industry) {
      return res.status(404).json({
        success: false,
        error: 'Destination industry not found'
      });
    }

    const updated = await dbHelpers.update('cars', req.params.id, {
      currentIndustry: destinationIndustryId,
      lastMoved: new Date(),
      sessionsAtCurrentLocation: 0
    });

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const car = await dbHelpers.findById('cars', req.params.id);
    res.json({
      success: true,
      data: car,
      message: 'Car moved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to move car',
      message: error.message
    });
  }
});

// DELETE /api/cars/:id - Delete car
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbHelpers.delete('cars', req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete car',
      message: error.message
    });
  }
});

export default router;
