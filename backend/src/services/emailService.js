const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/ApiError');
const emailHistoryService = require('./emailHistoryService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: config.email.smtp.auth,
      });

      // Verify connection configuration (with better error handling)
      try {
        await this.transporter.verify();
        logger.info('Email transporter initialized and verified successfully');
      } catch (verifyError) {
        logger.warn('Email transporter created but verification failed:', verifyError.message);
        logger.info('Email service will continue - verification will happen on first send attempt');
        // Don't throw error here - let the service start and fail gracefully on actual send
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw new ApiError(500, 'Email service initialization failed');
    }
  }

  /**
   * Send a single email
   */
  async sendEmail({ to, subject, body, attachments = [], jobId, personalizedData, source = 'manual' }) {
    try {
      // Log the original email address for debugging
      logger.info(`Original email address: ${to}`);
      
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      // Process attachments to proper nodemailer format
      const processedAttachments = attachments.map((attachment, index) => {
        if (attachment.filename && attachment.content) {
          // Already in correct format
          return attachment;
        } else if (attachment.name && attachment.data) {
          // File object from frontend with base64 data
          return {
            filename: attachment.name,
            content: Buffer.from(attachment.data, 'base64'),
            contentType: attachment.type || 'application/octet-stream'
          };
        } else if (attachment.path) {
          // Template attachment with file path (stored on server)
          return {
            filename: attachment.name || attachment.originalname,
            path: attachment.path,
            contentType: attachment.type || attachment.mimetype || 'application/octet-stream'
          };
        } else {
          // Fallback - create a generic name
          return {
            filename: attachment.name || `attachment-${index + 1}`,
            content: attachment.data || attachment,
            contentType: attachment.type || 'application/octet-stream'
          };
        }
      });

      // Mark as processing in database if jobId is provided
      if (jobId) {
        try {
          await emailHistoryService.markAsProcessing(jobId);
        } catch (dbError) {
          logger.warn(`Failed to update database status for job ${jobId}:`, dbError);
        }
      }

      const mailOptions = {
        from: `"${config.email.senderName}" <${config.email.from}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: processedAttachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      
      // Mark as sent in database if jobId is provided
      if (jobId) {
        try {
          await emailHistoryService.markAsSent(jobId, result.messageId);
        } catch (dbError) {
          logger.warn(`Failed to update database status for job ${jobId}:`, dbError);
        }
      }
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
      };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      
      // Mark as failed in database if jobId is provided
      if (jobId) {
        try {
          await emailHistoryService.markAsFailed(jobId, error);
        } catch (dbError) {
          logger.warn(`Failed to update database status for job ${jobId}:`, dbError);
        }
      }
      
      return {
        success: false,
        error: error.message,
        recipient: to,
      };
    }
  }

  /**
   * Send bulk emails via queue (replaced by queue service)
   * This method is now deprecated - use queueService.addBulkEmailsToQueue instead
   */
  async sendBulkEmails({ recipients, subject, body, attachments, userId }) {
    logger.warn('sendBulkEmails is deprecated - use queueService.addBulkEmailsToQueue instead');
    
    // This method should not be used directly anymore
    // All bulk email sending should go through the queue system
    throw new Error('Bulk email sending should use the queue system. Use queueService.addBulkEmailsToQueue instead.');
  }

  /**
   * Personalize email content with recipient data
   */
  personalizeContent(content, recipient) {
    let personalizedContent = content;
    
    // Log the recipient data for debugging
    logger.info(`Personalizing content for recipient: ${JSON.stringify(recipient)}`);
    
    // Replace placeholders with recipient data
    Object.keys(recipient).forEach(key => {
      const placeholder = `{{${key}}}`;
      // Don't modify email addresses during personalization
      if (key === 'email') {
        logger.info(`Replacing email placeholder with: ${recipient[key]}`);
        personalizedContent = personalizedContent.replace(
          new RegExp(placeholder, 'g'),
          recipient[key] || ''
        );
      } else {
        personalizedContent = personalizedContent.replace(
          new RegExp(placeholder, 'g'),
          recipient[key] || ''
        );
      }
    });

    return personalizedContent;
  }

  /**
   * Get job status (deprecated - use queueService.getJobStatus)
   */
  async getJobStatus(jobId) {
    logger.warn('getJobStatus is deprecated - use queueService.getJobStatus instead');
    throw new Error('Job status should be retrieved from queueService.getJobStatus');
  }

  /**
   * Get email history (deprecated - use dedicated history service)
   */
  async getEmailHistory({ userId, page, limit, status }) {
    logger.warn('getEmailHistory is deprecated - implement dedicated history service');
    throw new Error('Email history should be retrieved from a dedicated history service');
  }

  /**
   * Cancel email job (deprecated - use queueService.cancelJob)
   */
  async cancelJob(jobId, userId) {
    logger.warn('cancelJob is deprecated - use queueService.cancelJob instead');
    throw new Error('Job cancellation should use queueService.cancelJob');
  }

  /**
   * Validate email address
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email service health
   */
  async getHealth() {
    try {
      if (!this.transporter) {
        return { status: 'error', message: 'Transporter not initialized' };
      }

      await this.transporter.verify();
      return { status: 'healthy', message: 'Email service operational' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();