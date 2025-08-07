// Export all middleware from a central location
const { verifyToken, requireRole, optionalAuth } = require('./auth');
const { errorHandler, notFound } = require('./errorHandler');
const { handleValidationErrors, validateBodySize, sanitizeInput } = require('./validation');
const { apiLimiter, authLimiter, emailLimiter, uploadLimiter } = require('./rateLimiter');

module.exports = {
  // Authentication middleware
  verifyToken,
  requireRole,
  optionalAuth,
  
  // Error handling middleware
  errorHandler,
  notFound,
  
  // Validation middleware
  handleValidationErrors,
  validateBodySize,
  sanitizeInput,
  
  // Rate limiting middleware
  apiLimiter,
  authLimiter,
  emailLimiter,
  uploadLimiter,
};