const express = require('express');
const { getHealth, getStatus } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Get API health status
 * @access  Public
 */
router.get('/', getHealth);

/**
 * @route   GET /api/status
 * @desc    Get API status (legacy endpoint)
 * @access  Public
 */
router.get('/status', getStatus);

module.exports = router;