const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const config = require('../config');

/**
 * @desc    Get API health status
 * @route   GET /api/health
 * @access  Public
 */
const getHealth = asyncHandler(async (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
  };

  res.json(new ApiResponse(200, healthData, 'Health check successful'));
});

/**
 * @desc    Get API status (legacy endpoint)
 * @route   GET /api/status
 * @access  Public
 */
const getStatus = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { message: "Hello from the backend! 👋" }, 'Status check successful'));
});

module.exports = {
  getHealth,
  getStatus,
};