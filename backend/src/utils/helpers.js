const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generate a secure random token
 */
const generateSecureToken = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password, rounds = 12) => {
  return await bcrypt.hash(password, rounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize string for database storage
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

/**
 * Check if file type is allowed
 */
const isAllowedFileType = (filename, allowedTypes) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

/**
 * Generate pagination metadata
 */
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Delay execution (for testing or rate limiting)
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone an object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Remove sensitive data from object
 */
const removeSensitiveData = (obj, sensitiveFields = ['password', 'token', 'secret']) => {
  const cleaned = deepClone(obj);
  
  const removeFields = (target) => {
    if (typeof target === 'object' && target !== null) {
      sensitiveFields.forEach(field => {
        if (field in target) {
          delete target[field];
        }
      });
      
      Object.values(target).forEach(value => {
        if (typeof value === 'object') {
          removeFields(value);
        }
      });
    }
  };
  
  removeFields(cleaned);
  return cleaned;
};

/**
 * Convert string to slug format
 */
const slugify = (str) => {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Capitalize first letter of string
 */
const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert camelCase to snake_case
 */
const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = (str) => {
  return str.replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );
};

/**
 * Check if value is empty
 */
const isEmpty = (value) => {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return req.ip ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
  return new Date(date).toISOString();
};

/**
 * Get time difference in human readable format
 */
const getTimeDifference = (startTime, endTime = new Date()) => {
  const diffMs = endTime - startTime;
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs} seconds`;
  if (diffMins < 60) return `${diffMins} minutes`;
  if (diffHours < 24) return `${diffHours} hours`;
  return `${diffDays} days`;
};

module.exports = {
  generateRandomString,
  generateSecureToken,
  hashPassword,
  comparePassword,
  isValidEmail,
  isValidUrl,
  sanitizeString,
  formatFileSize,
  getFileExtension,
  isAllowedFileType,
  generatePagination,
  delay,
  deepClone,
  removeSensitiveData,
  slugify,
  capitalize,
  camelToSnake,
  snakeToCamel,
  isEmpty,
  getClientIP,
  formatDate,
  getTimeDifference,
};