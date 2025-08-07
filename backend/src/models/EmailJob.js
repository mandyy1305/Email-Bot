/**
 * Email Job Model
 * Represents an email sending job in the system
 */

class EmailJob {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.subject = data.subject;
    this.body = data.body;
    this.recipients = data.recipients || [];
    this.attachments = data.attachments || [];
    this.status = data.status || 'queued'; // queued, processing, completed, failed, cancelled
    this.priority = data.priority || 'normal'; // low, normal, high
    this.scheduledAt = data.scheduledAt || null;
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.progress = data.progress || 0;
    this.totalRecipients = data.totalRecipients || this.recipients.length;
    this.successCount = data.successCount || 0;
    this.failureCount = data.failureCount || 0;
    this.errors = data.errors || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Generate unique job ID
   */
  generateId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update job status
   */
  updateStatus(status, metadata = {}) {
    this.status = status;
    this.updatedAt = new Date();
    
    if (status === 'processing' && !this.startedAt) {
      this.startedAt = new Date();
    }
    
    if (['completed', 'failed', 'cancelled'].includes(status) && !this.completedAt) {
      this.completedAt = new Date();
    }

    // Merge metadata
    this.metadata = { ...this.metadata, ...metadata };
  }

  /**
   * Update progress
   */
  updateProgress(successCount, failureCount) {
    this.successCount = successCount;
    this.failureCount = failureCount;
    this.progress = Math.round(((successCount + failureCount) / this.totalRecipients) * 100);
    this.updatedAt = new Date();
  }

  /**
   * Add error to job
   */
  addError(error) {
    this.errors.push({
      message: error.message || error,
      timestamp: new Date(),
      details: error.details || null,
    });
    this.updatedAt = new Date();
  }

  /**
   * Check if job is active
   */
  isActive() {
    return ['queued', 'processing'].includes(this.status);
  }

  /**
   * Check if job is completed
   */
  isCompleted() {
    return ['completed', 'failed', 'cancelled'].includes(this.status);
  }

  /**
   * Get job duration
   */
  getDuration() {
    if (!this.startedAt) return 0;
    
    const endTime = this.completedAt || new Date();
    return endTime - this.startedAt;
  }

  /**
   * Get success rate
   */
  getSuccessRate() {
    const totalProcessed = this.successCount + this.failureCount;
    if (totalProcessed === 0) return 0;
    
    return Math.round((this.successCount / totalProcessed) * 100);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      subject: this.subject,
      body: this.body,
      recipientCount: this.totalRecipients,
      status: this.status,
      priority: this.priority,
      progress: this.progress,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: this.getSuccessRate(),
      duration: this.getDuration(),
      scheduledAt: this.scheduledAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      errors: this.errors,
      metadata: this.metadata,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new EmailJob(row);
  }

  /**
   * Validate job data
   */
  validate() {
    const errors = [];

    if (!this.subject || this.subject.trim() === '') {
      errors.push('Subject is required');
    }

    if (!this.body || this.body.trim() === '') {
      errors.push('Body is required');
    }

    if (!this.recipients || this.recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    // Validate recipients
    this.recipients.forEach((recipient, index) => {
      if (!recipient.email) {
        errors.push(`Recipient ${index + 1} is missing email address`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = EmailJob;