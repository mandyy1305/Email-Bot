const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
  // Job Information
  jobId: {
    type: String,
    required: true,
    index: true
  },
  
  // Recipient Information
  recipient: {
    email: {
      type: String,
      required: true,
      index: true
    },
    firstName: String,
    lastName: String,
    fullName: String
  },
  
  // Sender Information
  sender: {
    email: {
      type: String,
      index: true
    },
    name: String,
    userId: String // For tracking which configured user was used
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
    contentType: String
  }],
  
  // Email Status
  status: {
    type: String,
    enum: ['queued', 'processing', 'sent', 'failed', 'bounced'],
    default: 'queued',
    index: true
  },
  
  // Timestamps
  queuedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  sentAt: Date,
  failedAt: Date,
  
  // Email Provider Response
  messageId: String,
  
  // Error Information
  error: {
    message: String,
    code: String,
    details: String
  },
  
  // Delivery Information
  delivery: {
    attempts: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    response: String
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['excel', 'manual', 'api', 'bulk'],
    default: 'manual'
  },
  
  // Campaign Information (optional)
  campaign: {
    name: String,
    id: String
  },
  
  // Additional Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    originalData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'email_history'
});

// Indexes for better query performance
emailHistorySchema.index({ 'recipient.email': 1, createdAt: -1 });
emailHistorySchema.index({ status: 1, createdAt: -1 });
emailHistorySchema.index({ queuedAt: -1 });
emailHistorySchema.index({ sentAt: -1 });

// Instance methods
emailHistorySchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

emailHistorySchema.methods.markAsSent = function(messageId) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.messageId = messageId;
  return this.save();
};

emailHistorySchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = {
    message: error.message,
    code: error.code,
    details: error.stack
  };
  this.delivery.attempts += 1;
  this.delivery.lastAttempt = new Date();
  return this.save();
};

// Static methods
emailHistorySchema.statics.getStatsByDateRange = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

emailHistorySchema.statics.getEmailsByRecipient = function(email, limit = 50) {
  return this.find({ 'recipient.email': email })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('EmailHistory', emailHistorySchema);