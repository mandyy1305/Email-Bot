/**
 * Standardized API Response class for consistent response formatting
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success', metadata = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    
    if (metadata) {
      this.metadata = metadata;
    }
  }

  /**
   * Create a successful response (200)
   */
  static success(data, message = 'Success', metadata = null) {
    return new ApiResponse(200, data, message, metadata);
  }

  /**
   * Create a created response (201)
   */
  static created(data, message = 'Created', metadata = null) {
    return new ApiResponse(201, data, message, metadata);
  }

  /**
   * Create an accepted response (202)
   */
  static accepted(data, message = 'Accepted', metadata = null) {
    return new ApiResponse(202, data, message, metadata);
  }

  /**
   * Create a no content response (204)
   */
  static noContent(message = 'No Content') {
    return new ApiResponse(204, null, message);
  }

  /**
   * Create a paginated response
   */
  static paginated(data, pagination, message = 'Success') {
    return new ApiResponse(200, data, message, { pagination });
  }

  /**
   * Create a response with custom metadata
   */
  static withMetadata(statusCode, data, message, metadata) {
    return new ApiResponse(statusCode, data, message, metadata);
  }
}

module.exports = { ApiResponse };