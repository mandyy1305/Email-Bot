const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalname: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },
  metadata: {
    personalizedFields: [String], // Fields that can be personalized like firstName, lastName
    variables: [String] // Variables used in the template
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
emailTemplateSchema.index({ name: 1 });
emailTemplateSchema.index({ isDefault: 1 });
emailTemplateSchema.index({ isActive: 1 });
emailTemplateSchema.index({ lastUsed: -1 });

// Virtual for attachment count
emailTemplateSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Method to mark template as used
emailTemplateSchema.methods.markAsUsed = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to set as default template
emailTemplateSchema.methods.setAsDefault = async function() {
  // Remove default from all other templates
  await this.constructor.updateMany(
    { _id: { $ne: this._id } },
    { $set: { isDefault: false } }
  );
  
  // Set this template as default
  this.isDefault = true;
  return this.save();
};

// Static method to get default template
emailTemplateSchema.statics.getDefault = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Static method to get active templates
emailTemplateSchema.statics.getActiveTemplates = function() {
  return this.find({ isActive: true }).sort({ lastUsed: -1, createdAt: -1 });
};

// Pre-save middleware to ensure only one default template
emailTemplateSchema.pre('save', async function(next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
