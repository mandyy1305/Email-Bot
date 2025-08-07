const express = require('express');
const healthRoutes = require('./healthRoutes');
const emailRoutes = require('./emailRoutes');
const historyRoutes = require('./historyRoutes');
const templateRoutes = require('./templateRoutes');
const userRoutes = require('./userRoutes');
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
router.use('/templates', templateRoutes);
router.use('/users', userRoutes);

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
      templates: {
        list: 'GET /api/templates',
        get: 'GET /api/templates/:id',
        create: 'POST /api/templates',
        update: 'PUT /api/templates/:id',
        delete: 'DELETE /api/templates/:id',
        default: 'GET /api/templates/default',
        setDefault: 'PUT /api/templates/:id/default',
        createDefault: 'POST /api/templates/default',
        stats: 'GET /api/templates/stats',
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        reload: 'POST /api/users/reload',
        stats: 'GET /api/users/stats',
      },
    },
  });
});

module.exports = router;