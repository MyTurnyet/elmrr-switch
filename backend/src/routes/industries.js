import express from 'express';
import { dbHelpers } from '../database/index.js';
import { validateIndustry } from '../models/industry.js';

const router = express.Router();

// GET /api/industries - Get all industries
router.get('/', async (req, res) => {
  try {
    const industries = await dbHelpers.findAll('industries');
    res.json({
      success: true,
      data: industries,
      count: industries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch industries',
      message: error.message
    });
  }
});

// GET /api/industries/:id - Get industry by ID
router.get('/:id', async (req, res) => {
  try {
    const industry = await dbHelpers.findById('industries', req.params.id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        error: 'Industry not found'
      });
    }
    res.json({
      success: true,
      data: industry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch industry',
      message: error.message
    });
  }
});

// GET /api/industries/:id/cars - Get cars currently at industry
router.get('/:id/cars', async (req, res) => {
  try {
    const cars = await dbHelpers.findByQuery('cars', { currentIndustry: req.params.id });
    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cars at industry',
      message: error.message
    });
  }
});

// POST /api/industries - Create new industry
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateIndustry(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const newIndustry = await dbHelpers.create('industries', value);
    res.status(201).json({
      success: true,
      data: newIndustry,
      message: 'Industry created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create industry',
      message: error.message
    });
  }
});

// PUT /api/industries/:id - Update industry
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = validateIndustry(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const updated = await dbHelpers.update('industries', req.params.id, value);
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Industry not found'
      });
    }

    const industry = await dbHelpers.findById('industries', req.params.id);
    res.json({
      success: true,
      data: industry,
      message: 'Industry updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update industry',
      message: error.message
    });
  }
});

// DELETE /api/industries/:id - Delete industry
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbHelpers.delete('industries', req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Industry not found'
      });
    }

    res.json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete industry',
      message: error.message
    });
  }
});

export default router;
