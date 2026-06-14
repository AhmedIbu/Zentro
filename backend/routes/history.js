// GET /history?limit=50  -> returns recent download history from Supabase.

const express = require('express');
const router = express.Router();
const { getHistory, enabled } = require('../config/supabase');

router.get('/', async (req, res) => {
  if (!enabled) {
    return res.json({ enabled: false, items: [] });
  }
  try {
    const items = await getHistory(req.query.limit);
    res.json({ enabled: true, count: items.length, items });
  } catch (err) {
    console.error('[history] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history', details: err.message });
  }
});

module.exports = router;
