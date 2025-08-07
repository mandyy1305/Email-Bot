/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null, isOperational = true, stack = '') {
    super(message);
    
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(message = 'Bad Request', errors = null) {
    return new ApiError(400, message, errors);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message = 'Not Found') {
    return new ApiError(404, message);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  /**
   * Create an Unprocessable Entity error (422)
   */
  static unprocessableEntity(message = 'Unprocessable Entity', errors = null) {
    return new ApiError(422, message, errors);
  }

  /**
   * Create a Too Many Requests error (429)
   */
  static tooManyRequests(message = 'Too Many Requests') {
    return new ApiError(429, message);
  }

  /**
   * Create an Internal Server Error (500)
   */
  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(message = 'Service Unavailable') {
    return new ApiError(503, message);
  }
}

module.exports = { ApiError };