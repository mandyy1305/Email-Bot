const express = require('express');
const healthRoutes = require('./healthRoutes');
const emailRoutes = require('./emailRoutes');
const historyRoutes = require('./historyRoutes');
const { apiLimiter } = require('../middleware');

const router = express.Router();

// Apply general rate limiting to all API routes
router.use(apiLimiter);

// Health and status routes
router.use('/health', healthRoutes);
router.use('/status', healthRoutes); // Legacy route

// Email routes
router.use('/emails', emailRoutes);
router.use('/history', historyRoutes);

// API documentation route (future enhancement)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Email Bot API v1.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      emails: {
        processExcel: 'POST /api/emails/process-excel',
        send: 'POST /api/emails/send',
        jobStatus: 'GET /api/emails/job/:jobId',
        stats: 'GET /api/emails/stats',
        cancelJob: 'DELETE /api/emails/job/:jobId',
        pauseQueue: 'POST /api/emails/queue/pause',
        resumeQueue: 'POST /api/emails/queue/resume',
      },
    },
  });
});

module.exports = router;