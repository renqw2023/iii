/**
 * Admin Sync Routes
 *
 * GET  /api/admin/sync/status           — latest status for all sources
 * POST /api/admin/sync/trigger/:source  — trigger sync (async, returns immediately)
 * GET  /api/admin/sync/logs             — paginated history
 * POST /api/admin/sync/sref/stop        — stop sref crawl
 * GET  /api/admin/sync/sref/progress    — real-time sref progress
 */

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { runSync, getStatus, getLogs, stopSync, getSrefProgress } = require('../services/dataSyncService');

// All routes require admin auth
router.use(adminAuth);

// GET /api/admin/sync/status
router.get('/status', async (req, res) => {
  try {
    const status = await getStatus();
    res.json({ ok: true, data: status });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/admin/sync/trigger/:source
router.post('/trigger/:source', async (req, res) => {
  const { source } = req.params;
  const opts = req.body || {};
  try {
    const result = await runSync(source, opts);
    res.json({ ok: result.ok, message: result.message, logId: result.logId });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

// GET /api/admin/sync/logs?page=1&limit=20
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await getLogs(page, limit);
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/admin/sync/sref/stop
router.post('/sref/stop', (req, res) => {
  const result = stopSync('sref');
  res.json(result);
});

// GET /api/admin/sync/sref/progress
router.get('/sref/progress', (req, res) => {
  res.json({ ok: true, data: getSrefProgress() });
});

module.exports = router;
