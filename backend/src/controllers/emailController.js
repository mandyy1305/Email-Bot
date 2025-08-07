const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const emailService = require('../services/emailService');
const excelService = require('../services/excelService');
const queueService = require('../services/queueService');

/**
 * @desc    Process Excel file and extract email data
 * @route   POST /api/emails/process-excel
 * @access  Private
 */
const processExcelFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No Excel file uploaded');
  }

  const { fieldMapping } = req.body;
  
  if (!fieldMapping) {
    throw new ApiError(400, 'Field mapping is required');
  }

  const processedData = await excelService.processExcelFile(req.file.path, fieldMapping);

  res.json(new ApiResponse(
    200,
    processedData,
    'Excel file processed successfully'
  ));
});

/**
 * @desc    Send emails via queue system
 * @route   POST /api/emails/send
 * @access  Private
 */
const sendEmails = asyncHandler(async (req, res) => {
  const { recipients, subject, body, attachments } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new ApiError(400, 'Recipients array is required and cannot be empty');
  }

  if (!subject || !body) {
    throw new ApiError(400, 'Email subject and body are required');
  }

  // Prepare email data for queue
  const emailsData = recipients.map(recipient => ({
    to: recipient.email,
    subject,
    body,
    attachments: attachments || [],
    personalizedData: {
      firstName: recipient.firstName || '',
      lastName: recipient.lastName || '',
      fullName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim(),
      email: recipient.email,
      ...recipient // Include any additional fields
    }
  }));

  // Add emails to queue
  const queueResult = await queueService.addBulkEmailsToQueue(emailsData, {
    priority: req.body.priority || 0,
  });

  res.json(new ApiResponse(
    202,
    {
      totalJobs: queueResult.totalJobs,
      estimatedCompletionTime: queueResult.estimatedCompletionTime,
      message: `${queueResult.totalJobs} emails queued for processing`
    },
    'Emails queued successfully'
  ));
});

/**
 * @desc    Get email job status
 * @route   GET /api/emails/job/:jobId
 * @access  Private
 */
const getEmailJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  const jobStatus = await queueService.getJobStatus(jobId);
  
  if (!jobStatus) {
    throw new ApiError(404, 'Email job not found');
  }

  res.json(new ApiResponse(
    200,
    jobStatus,
    'Email job status retrieved successfully'
  ));
});

/**
 * @desc    Get queue statistics
 * @route   GET /api/emails/stats
 * @access  Private
 */
const getQueueStats = asyncHandler(async (req, res) => {
  const stats = await queueService.getQueueStats();

  res.json(new ApiResponse(
    200,
    stats,
    'Queue statistics retrieved successfully'
  ));
});

/**
 * @desc    Cancel email job
 * @route   DELETE /api/emails/job/:jobId
 * @access  Private
 */
const cancelEmailJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const cancelled = await queueService.cancelJob(jobId);

  if (!cancelled) {
    throw new ApiError(404, 'Email job not found or cannot be cancelled');
  }

  res.json(new ApiResponse(
    200,
    { jobId, status: 'cancelled' },
    'Email job cancelled successfully'
  ));
});

/**
 * @desc    Pause email queue
 * @route   POST /api/emails/queue/pause
 * @access  Private
 */
const pauseQueue = asyncHandler(async (req, res) => {
  await queueService.pauseQueue();

  res.json(new ApiResponse(
    200,
    { status: 'paused' },
    'Email queue paused successfully'
  ));
});

/**
 * @desc    Resume email queue
 * @route   POST /api/emails/queue/resume
 * @access  Private
 */
const resumeQueue = asyncHandler(async (req, res) => {
  await queueService.resumeQueue();

  res.json(new ApiResponse(
    200,
    { status: 'resumed' },
    'Email queue resumed successfully'
  ));
});

module.exports = {
  processExcelFile,
  sendEmails,
  getEmailJobStatus,
  getQueueStats,
  cancelEmailJob,
  pauseQueue,
  resumeQueue,
};