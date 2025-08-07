const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

/**
 * Middleware to handle validation results from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new ApiError(400, 'Validation failed', errorMessages);
  }
  
  next();
};

/**
 * Middleware to validate request body size
 */
const validateBodySize = (maxSize = 1024 * 1024) => { // Default 1MB
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'));
    
    if (contentLength > maxSize) {
      throw new ApiError(413, 'Request body too large');
    }
    
    next();
  };
};

/**
 * Middleware to sanitize request data
 */
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateBodySize,
  sanitizeInput,
};