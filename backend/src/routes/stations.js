import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const stations = await dbHelpers.findAll('stations');
    res.json({ success: true, data: stations, count: stations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stations', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const station = await dbHelpers.findById('stations', req.params.id);
    if (!station) return res.status(404).json({ success: false, error: 'Station not found' });
    res.json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch station', message: error.message });
  }
});

export default router;
