import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tracks = await dbHelpers.findAll('tracks');
    res.json({ success: true, data: tracks, count: tracks.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tracks', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const track = await dbHelpers.findById('tracks', req.params.id);
    if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
    res.json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch track', message: error.message });
  }
});

export default router;
