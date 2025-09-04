import express from 'express';
import { dbHelpers } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const aarTypes = await dbHelpers.findAll('aarTypes');
    res.json({ success: true, data: aarTypes, count: aarTypes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch AAR types', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const aarType = await dbHelpers.findById('aarTypes', req.params.id);
    if (!aarType) return res.status(404).json({ success: false, error: 'AAR type not found' });
    res.json({ success: true, data: aarType });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch AAR type', message: error.message });
  }
});

export default router;
