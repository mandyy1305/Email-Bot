const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
  // Campaign Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Email Content
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  
  // Attachments
  attachments: [{
    filename: String,
    size: Number,
    contentType: String,
    path: String
  }],
  
  // Recipients
  recipients: [{
    email: {
      type: String,
      required: true
    },
    firstName: String,
    lastName: String,
    customFields: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced'],
      default: 'pending'
    }
  }],
  
  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'],
    default: 'draft'
  },
  
  // Scheduling
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Statistics
  stats: {
    total: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    }
  },
  
  // Settings
  settings: {
    delayBetweenEmails: {
      type: Number,
      default: 5
    },
    trackOpens: {
      type: Boolean,
      default: false
    },
    trackClicks: {
      type: Boolean,
      default: false
    }
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['excel', 'manual', 'api'],
    default: 'manual'
  },
  sourceFile: String,
  
  // Creator Information
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'email_campaigns'
});

// Indexes
emailCampaignSchema.index({ status: 1, createdAt: -1 });
emailCampaignSchema.index({ createdBy: 1, createdAt: -1 });
emailCampaignSchema.index({ scheduledAt: 1 });

// Instance methods
emailCampaignSchema.methods.updateStats = function() {
  this.stats.total = this.recipients.length;
  this.stats.sent = this.recipients.filter(r => r.status === 'sent').length;
  this.stats.failed = this.recipients.filter(r => r.status === 'failed').length;
  this.stats.bounced = this.recipients.filter(r => r.status === 'bounced').length;
  return this.save();
};

emailCampaignSchema.methods.markAsStarted = function() {
  this.status = 'sending';
  this.startedAt = new Date();
  return this.save();
};

emailCampaignSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.updateStats();
};

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);