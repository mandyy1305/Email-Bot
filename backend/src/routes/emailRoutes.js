const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  processExcelFile, 
  sendEmails, 
  getEmailJobStatus, 
  getQueueStats,
  cancelEmailJob,
  pauseQueue,
  resumeQueue
} = require('../controllers/emailController');
const { 
  verifyToken, 
  emailLimiter, 
  uploadLimiter,
  handleValidationErrors 
} = require('../middleware');
const { validateEmailRequest } = require('../validators/emailValidators');
const config = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `excel-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (config.upload.allowedFileTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${config.upload.allowedFileTypes.join(', ')} files are allowed`), false);
    }
  },
});

/**
 * @route   POST /api/emails/process-excel
 * @desc    Process Excel file and extract email data
 * @access  Public (auth disabled for now)
 */
router.post('/process-excel', 
  uploadLimiter,
  upload.single('excelFile'),
  processExcelFile
);

/**
 * @route   POST /api/emails/send
 * @desc    Send emails via queue system
 * @access  Public (auth disabled for now)
 */
router.post('/send',
  emailLimiter,
  validateEmailRequest,
  handleValidationErrors,
  sendEmails
);

/**
 * @route   GET /api/emails/job/:jobId
 * @desc    Get email job status
 * @access  Public (auth disabled for now)
 */
router.get('/job/:jobId',
  getEmailJobStatus
);

/**
 * @route   GET /api/emails/stats
 * @desc    Get queue statistics
 * @access  Public (auth disabled for now)
 */
router.get('/stats',
  getQueueStats
);

/**
 * @route   POST /api/emails/queue/pause
 * @desc    Pause email queue
 * @access  Public (auth disabled for now)
 */
router.post('/queue/pause',
  pauseQueue
);

/**
 * @route   POST /api/emails/queue/resume
 * @desc    Resume email queue
 * @access  Public (auth disabled for now)
 */
router.post('/queue/resume',
  resumeQueue
);

/**
 * @route   DELETE /api/emails/job/:jobId
 * @desc    Cancel email job
 * @access  Public (auth disabled for now)
 */
router.delete('/job/:jobId',
  cancelEmailJob
);

module.exports = router;