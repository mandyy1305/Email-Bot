const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const emailHistoryService = require('../services/emailHistoryService');

const router = express.Router();

/**
 * @route   GET /api/history/emails
 * @desc    Get email history with pagination and filters
 * @access  Public
 */
router.get('/emails', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    email,
    dateFrom,
    dateTo,
    source
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (email) filters.email = email;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (source) filters.source = source;

  const result = await emailHistoryService.getEmailHistory(
    filters,
    parseInt(page),
    parseInt(limit)
  );

  res.json(new ApiResponse(
    200,
    result,
    'Email history retrieved successfully'
  ));
}));

/**
 * @route   GET /api/history/stats
 * @desc    Get email statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await emailHistoryService.getEmailStats(parseInt(days));

  res.json(new ApiResponse(
    200,
    stats,
    'Email statistics retrieved successfully'
  ));
}));

/**
 * @route   GET /api/history/recipient/:email
 * @desc    Get emails sent to a specific recipient
 * @access  Public
 */
router.get('/recipient/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { limit = 50 } = req.query;

  const emails = await emailHistoryService.getEmailsByRecipient(email, parseInt(limit));

  res.json(new ApiResponse(
    200,
    emails,
    `Email history for ${email} retrieved successfully`
  ));
}));

/**
 * @route   GET /api/history/campaigns
 * @desc    Get campaign statistics
 * @access  Public
 */
router.get('/campaigns', asyncHandler(async (req, res) => {
  const stats = await emailHistoryService.getCampaignStats();

  res.json(new ApiResponse(
    200,
    stats,
    'Campaign statistics retrieved successfully'
  ));
}));

/**
 * @route   POST /api/history/campaigns
 * @desc    Create a new email campaign
 * @access  Public
 */
router.post('/campaigns', asyncHandler(async (req, res) => {
  const campaign = await emailHistoryService.createCampaign(req.body);

  res.status(201).json(new ApiResponse(
    201,
    campaign,
    'Campaign created successfully'
  ));
}));

module.exports = router;