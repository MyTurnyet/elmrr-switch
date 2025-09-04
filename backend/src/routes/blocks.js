import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const blocks = await dbHelpers.findAll('blocks');
    res.json({ success: true, data: blocks, count: blocks.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch blocks', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const block = await dbHelpers.findById('blocks', req.params.id);
    if (!block) return res.status(404).json({ success: false, error: 'Block not found' });
    res.json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch block', message: error.message });
  }
});

export default router;
