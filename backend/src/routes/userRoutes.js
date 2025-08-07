const express = require('express');
const router = express.Router();
const emailUserService = require('../services/emailUserService');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * GET /api/users - Get all SMTP users (without passwords)
 */
router.get('/', async (req, res, next) => {
  try {
    const users = emailUserService.getAllUsers();
    
    res.json(new ApiResponse(200, {
      users,
      count: users.length
    }, 'SMTP users retrieved successfully'));
  } catch (error) {
    logger.error('Error getting SMTP users:', error);
    next(new ApiError(500, 'Failed to retrieve SMTP users'));
  }
});

/**
 * GET /api/users/stats - Get user statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = emailUserService.getUserCount();
    
    res.json(new ApiResponse(200, {
      totalUsers,
      status: totalUsers > 0 ? 'configured' : 'not_configured'
    }, 'SMTP user statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error getting SMTP user stats:', error);
    next(new ApiError(500, 'Failed to retrieve SMTP user statistics'));
  }
});

/**
 * GET /api/users/:id - Get specific SMTP user
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = emailUserService.getUserById(id);
    
    if (!user) {
      return next(new ApiError(404, 'SMTP user not found'));
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(new ApiResponse(200, userWithoutPassword, 'SMTP user retrieved successfully'));
  } catch (error) {
    logger.error('Error getting SMTP user:', error);
    next(new ApiError(500, 'Failed to retrieve SMTP user'));
  }
});

/**
 * POST /api/users - Add new SMTP user
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, password, name, host, port, secure } = req.body;
    
    if (!email || !password) {
      return next(new ApiError(400, 'Email and password are required'));
    }

    const userId = emailUserService.addUser({
      email,
      password,
      name,
      host,
      port,
      secure
    });
    
    res.status(201).json(new ApiResponse(201, {
      id: userId,
      email,
      name: name || email.split('@')[0]
    }, 'SMTP user added successfully'));
  } catch (error) {
    logger.error('Error adding SMTP user:', error);
    next(new ApiError(500, error.message || 'Failed to add SMTP user'));
  }
});

/**
 * PUT /api/users/:id - Update SMTP user
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove password from logs for security
    const logData = { ...updateData };
    if (logData.password) logData.password = '[REDACTED]';
    logger.debug(`Updating SMTP user ${id}:`, logData);
    
    const success = emailUserService.updateUser(id, updateData);
    
    if (!success) {
      return next(new ApiError(404, 'SMTP user not found'));
    }
    
    res.json(new ApiResponse(200, { id }, 'SMTP user updated successfully'));
  } catch (error) {
    logger.error('Error updating SMTP user:', error);
    next(new ApiError(500, 'Failed to update SMTP user'));
  }
});

/**
 * DELETE /api/users/:id - Remove SMTP user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const success = emailUserService.removeUser(id);
    
    if (!success) {
      return next(new ApiError(404, 'SMTP user not found'));
    }
    
    res.json(new ApiResponse(200, { id }, 'SMTP user removed successfully'));
  } catch (error) {
    logger.error('Error removing SMTP user:', error);
    next(new ApiError(500, 'Failed to remove SMTP user'));
  }
});

/**
 * POST /api/users/reload - Reload users from configuration
 */
router.post('/reload', async (req, res, next) => {
  try {
    emailUserService.reloadUsers();
    const users = emailUserService.getAllUsers();
    
    res.json(new ApiResponse(200, {
      users,
      count: users.length
    }, 'SMTP users reloaded successfully'));
  } catch (error) {
    logger.error('Error reloading SMTP users:', error);
    next(new ApiError(500, 'Failed to reload SMTP users'));
  }
});

module.exports = router;
