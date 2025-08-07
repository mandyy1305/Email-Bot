const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/ApiError');
const emailHistoryService = require('./emailHistoryService');
const emailUserService = require('./emailUserService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.transporterCache = new Map(); // Cache transporters for different users
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter (fallback/default)
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
        logger.info('Default email transporter initialized and verified successfully');
      } catch (verifyError) {
        logger.warn('Default email transporter created but verification failed:', verifyError.message);
        logger.info('Email service will continue - verification will happen on first send attempt');
        // Don't throw error here - let the service start and fail gracefully on actual send
      }
    } catch (error) {
      logger.error('Failed to initialize default email transporter:', error);
      throw new ApiError(500, 'Email service initialization failed');
    }
  }

  /**
   * Create transporter for a specific user
   */
  async createTransporterForUser(user) {
    try {
      const transporter = nodemailer.createTransport({
        host: user.host,
        port: user.port,
        secure: user.secure,
        auth: {
          user: user.email,
          pass: user.password,
        },
      });

      // Cache the transporter for reuse
      this.transporterCache.set(user.email, transporter);
      
      logger.debug(`Created transporter for user: ${user.email}`);
      return transporter;
    } catch (error) {
      logger.error(`Failed to create transporter for user ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * Get transporter for a user (with caching)
   */
  async getTransporterForUser(user) {
    if (this.transporterCache.has(user.email)) {
      return this.transporterCache.get(user.email);
    }
    
    return await this.createTransporterForUser(user);
  }

  /**
   * Send a single email
   */
  async sendEmail({ to, subject, body, attachments = [], jobId, personalizedData, source = 'manual' }) {
    try {
      // Log the original email address for debugging
      logger.info(`Original email address: ${to}`);
      
      // Select a random user for sending this email
      const selectedUser = emailUserService.getRandomUser();
      let transporter = this.transporter;
      let fromEmail = config.email.from;
      let senderName = config.email.senderName;
      
      if (selectedUser) {
        transporter = await this.getTransporterForUser(selectedUser);
        fromEmail = selectedUser.email;
        senderName = selectedUser.name;
        logger.info(`📧 Using SMTP user: ${selectedUser.email} (${selectedUser.name})`);
      } else {
        logger.warn('⚠️ No SMTP users configured, using default transporter');
        if (!this.transporter) {
          await this.initializeTransporter();
        }
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
        from: `"${senderName}" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: processedAttachments,
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      
      // Mark as sent in database if jobId is provided
      if (jobId) {
        try {
          // Update with sender information
          await emailHistoryService.markAsSent(jobId, result.messageId, {
            email: fromEmail,
            name: senderName,
            userId: selectedUser ? selectedUser.id : 'default'
          });
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
          await emailHistoryService.markAsFailed(jobId, error, {
            email: fromEmail,
            name: senderName,
            userId: selectedUser ? selectedUser.id : 'default'
          });
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