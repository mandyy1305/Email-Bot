const config = require('../config');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  let err = error;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    err = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    err = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    err = new ApiError(400, message.join(', '));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new ApiError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new ApiError(401, message);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    err = new ApiError(400, message);
  }

  // Default to 500 server error
  if (!err.statusCode) {
    err = new ApiError(500, 'Internal Server Error');
  }

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(config.server.env === 'development' && { stack: err.stack }),
    },
  };

  // Add validation errors if present
  if (err.errors) {
    response.error.errors = err.errors;
  }

  res.status(err.statusCode || 500).json(response);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};