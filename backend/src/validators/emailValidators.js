const { body, param, query } = require('express-validator');

/**
 * Validation rules for bulk email sending
 */
const validateEmailRequest = [
  body('subject')
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters')
    .trim(),

  body('body')
    .notEmpty()
    .withMessage('Email body is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Email body must be between 1 and 50,000 characters'),

  body('recipients')
    .isArray({ min: 1 })
    .withMessage('Recipients must be an array with at least one recipient'),

  body('recipients.*.email')
    .isEmail()
    .withMessage('Each recipient must have a valid email address')
    .normalizeEmail(),

  body('recipients.*.firstName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters')
    .trim(),

  body('recipients.*.lastName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters')
    .trim(),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be low, normal, or high'),
];

/**
 * Validation rules for Excel file processing
 */
const validateExcelProcessing = [
  body('fieldMapping')
    .notEmpty()
    .withMessage('Field mapping is required')
    .isObject()
    .withMessage('Field mapping must be an object'),

  body('fieldMapping.emails')
    .isArray({ min: 1 })
    .withMessage('At least one email field must be selected'),

  body('fieldMapping.firstName')
    .optional()
    .isString()
    .withMessage('First name field must be a string'),

  body('fieldMapping.lastName')
    .optional()
    .isString()
    .withMessage('Last name field must be a string'),

  body('fieldMapping.customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object'),
];

/**
 * Validation rules for job ID parameter
 */
const validateJobId = [
  param('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .matches(/^job_\d+_[a-z0-9]+$/)
    .withMessage('Invalid job ID format'),
];

/**
 * Validation rules for email history query
 */
const validateHistoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(['queued', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Status must be one of: queued, processing, completed, failed, cancelled'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

/**
 * Validation rules for email address
 */
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),
];

/**
 * Custom validator for file upload
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No file uploaded',
      },
    });
  }

  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.',
      },
    });
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'File size too large. Maximum size is 10MB.',
      },
    });
  }

  next();
};

/**
 * Custom validator for recipients array
 */
const validateRecipientsArray = (req, res, next) => {
  const { recipients } = req.body;

  if (!recipients || !Array.isArray(recipients)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Recipients must be an array',
      },
    });
  }

  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'At least one recipient is required',
      },
    });
  }

  if (recipients.length > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Maximum 1000 recipients allowed per request',
      },
    });
  }

  // Validate each recipient
  const invalidRecipients = [];
  recipients.forEach((recipient, index) => {
    if (!recipient.email) {
      invalidRecipients.push(`Recipient ${index + 1} is missing email address`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      invalidRecipients.push(`Recipient ${index + 1} has invalid email format`);
    }
  });

  if (invalidRecipients.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid recipients',
        errors: invalidRecipients,
      },
    });
  }

  next();
};

module.exports = {
  validateEmailRequest,
  validateExcelProcessing,
  validateJobId,
  validateHistoryQuery,
  validateEmail,
  validateFileUpload,
  validateRecipientsArray,
};