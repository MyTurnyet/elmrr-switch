import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

// GET /api/locomotives - Get all locomotives
router.get('/', async (req, res) => {
  try {
    const locomotives = await dbHelpers.findAll('locomotives');
    res.json({
      success: true,
      data: locomotives,
      count: locomotives.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locomotives',
      message: error.message
    });
  }
});

// GET /api/locomotives/:id - Get locomotive by ID
router.get('/:id', async (req, res) => {
  try {
    const locomotive = await dbHelpers.findById('locomotives', req.params.id);
    if (!locomotive) {
      return res.status(404).json({
        success: false,
        error: 'Locomotive not found'
      });
    }
    res.json({
      success: true,
      data: locomotive
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locomotive',
      message: error.message
    });
  }
});

export default router;
