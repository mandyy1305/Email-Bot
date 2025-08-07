const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Middleware to verify JWT token
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid token.');
  }
});

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Access denied. User not authenticated.');
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new ApiError(403, 'Access denied. Insufficient permissions.');
    }

    next();
  });
};

/**
 * Optional authentication - doesn't throw error if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't throw error for optional auth
      req.user = null;
    }
  }
  
  next();
});

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
};