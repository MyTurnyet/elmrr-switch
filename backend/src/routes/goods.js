import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const goods = await dbHelpers.findAll('goods');
    res.json({ success: true, data: goods, count: goods.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch goods', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const good = await dbHelpers.findById('goods', req.params.id);
    if (!good) return res.status(404).json({ success: false, error: 'Good not found' });
    res.json({ success: true, data: good });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch good', message: error.message });
  }
});

export default router;
