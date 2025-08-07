const express = require('express');
const multer = require('multer');
const path = require('path');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const emailTemplateService = require('../services/emailTemplateService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/templates/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, text, and image files are allowed.'));
    }
  }
});

/**
 * @route   GET /api/templates
 * @desc    Get all active email templates
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const templates = await emailTemplateService.getActiveTemplates();
  
  res.json(new ApiResponse(
    200,
    templates,
    'Email templates retrieved successfully'
  ));
}));

/**
 * @route   GET /api/templates/default
 * @desc    Get default email template
 * @access  Public
 */
router.get('/default', asyncHandler(async (req, res) => {
  const defaultTemplate = await emailTemplateService.getDefaultTemplate();
  
  if (!defaultTemplate) {
    return res.json(new ApiResponse(
      200,
      null,
      'No default template found'
    ));
  }
  
  res.json(new ApiResponse(
    200,
    defaultTemplate,
    'Default template retrieved successfully'
  ));
}));

/**
 * @route   GET /api/templates/stats
 * @desc    Get template statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await emailTemplateService.getTemplateStats();
  
  res.json(new ApiResponse(
    200,
    stats,
    'Template statistics retrieved successfully'
  ));
}));

/**
 * @route   GET /api/templates/:id
 * @desc    Get template by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const template = await emailTemplateService.getTemplateById(req.params.id);
  
  res.json(new ApiResponse(
    200,
    template,
    'Template retrieved successfully'
  ));
}));

/**
 * @route   POST /api/templates
 * @desc    Create new email template
 * @access  Public
 */
router.post('/', upload.array('attachments', 10), asyncHandler(async (req, res) => {
  const { name, subject, body, isDefault } = req.body;
  
  // Validate template data
  const validation = emailTemplateService.validateTemplate({ name, subject, body });
  if (!validation.isValid) {
    return res.status(400).json(new ApiResponse(
      400,
      null,
      'Validation failed',
      validation.errors
    ));
  }

  // Process attachments
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];

  // Extract variables from template body
  const variables = emailTemplateService.extractVariables(body);

  const templateData = {
    name: name.trim(),
    subject: subject.trim(),
    body: body.trim(),
    attachments,
    isDefault: isDefault === 'true' || isDefault === true,
    metadata: {
      variables,
      personalizedFields: variables.filter(v => 
        ['firstName', 'lastName', 'fullName', 'email'].includes(v)
      )
    }
  };

  const template = await emailTemplateService.createTemplate(templateData);
  
  res.status(201).json(new ApiResponse(
    201,
    template,
    'Template created successfully'
  ));
}));

/**
 * @route   PUT /api/templates/:id
 * @desc    Update email template
 * @access  Public
 */
router.put('/:id', upload.array('attachments', 10), asyncHandler(async (req, res) => {
  const { name, subject, body, isDefault, removeAttachments } = req.body;
  
  // Validate template data
  const validation = emailTemplateService.validateTemplate({ name, subject, body });
  if (!validation.isValid) {
    return res.status(400).json(new ApiResponse(
      400,
      null,
      'Validation failed',
      validation.errors
    ));
  }

  // Get existing template
  const existingTemplate = await emailTemplateService.getTemplateById(req.params.id);
  
  // Process new attachments
  const newAttachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];

  // Handle attachment removal
  let attachments = [...existingTemplate.attachments];
  if (removeAttachments) {
    const toRemove = Array.isArray(removeAttachments) ? removeAttachments : [removeAttachments];
    const attachmentsToRemove = attachments.filter(att => toRemove.includes(att._id.toString()));
    
    // Clean up files
    await emailTemplateService.cleanupAttachments(attachmentsToRemove);
    
    // Remove from array
    attachments = attachments.filter(att => !toRemove.includes(att._id.toString()));
  }

  // Add new attachments
  attachments = [...attachments, ...newAttachments];

  // Extract variables from template body
  const variables = emailTemplateService.extractVariables(body);

  const updateData = {
    name: name.trim(),
    subject: subject.trim(),
    body: body.trim(),
    attachments,
    isDefault: isDefault === 'true' || isDefault === true,
    metadata: {
      variables,
      personalizedFields: variables.filter(v => 
        ['firstName', 'lastName', 'fullName', 'email'].includes(v)
      )
    }
  };

  const template = await emailTemplateService.updateTemplate(req.params.id, updateData);
  
  res.json(new ApiResponse(
    200,
    template,
    'Template updated successfully'
  ));
}));

/**
 * @route   PUT /api/templates/:id/default
 * @desc    Set template as default
 * @access  Public
 */
router.put('/:id/default', asyncHandler(async (req, res) => {
  const template = await emailTemplateService.setDefaultTemplate(req.params.id);
  
  res.json(new ApiResponse(
    200,
    template,
    'Template set as default successfully'
  ));
}));

/**
 * @route   PUT /api/templates/:id/use
 * @desc    Mark template as used (increment usage count)
 * @access  Public
 */
router.put('/:id/use', asyncHandler(async (req, res) => {
  const template = await emailTemplateService.markTemplateAsUsed(req.params.id);
  
  res.json(new ApiResponse(
    200,
    template,
    'Template usage recorded successfully'
  ));
}));

/**
 * @route   POST /api/templates/default
 * @desc    Create or update default template
 * @access  Public
 */
router.post('/default', upload.array('attachments', 10), asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  
  // Validate template data
  const validation = emailTemplateService.validateTemplate({ 
    name: 'Default Template', 
    subject, 
    body 
  });
  if (!validation.isValid) {
    return res.status(400).json(new ApiResponse(
      400,
      null,
      'Validation failed',
      validation.errors
    ));
  }

  // Process attachments
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];

  // Extract variables from template body
  const variables = emailTemplateService.extractVariables(body);

  const templateData = {
    subject: subject.trim(),
    body: body.trim(),
    attachments,
    metadata: {
      variables,
      personalizedFields: variables.filter(v => 
        ['firstName', 'lastName', 'fullName', 'email'].includes(v)
      )
    }
  };

  const template = await emailTemplateService.createOrUpdateDefaultTemplate(templateData);
  
  res.json(new ApiResponse(
    200,
    template,
    'Default template saved successfully'
  ));
}));

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete email template
 * @access  Public
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await emailTemplateService.deleteTemplate(req.params.id);
  
  res.json(new ApiResponse(
    200,
    null,
    'Template deleted successfully'
  ));
}));

module.exports = router;
