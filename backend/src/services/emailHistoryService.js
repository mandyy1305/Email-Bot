const EmailHistory = require('../models/EmailHistory');
const EmailCampaign = require('../models/EmailCampaign');
const logger = require('../utils/logger');

class EmailHistoryService {
  /**
   * Create email history record
   */
  async createEmailRecord(emailData) {
    try {
      const emailRecord = new EmailHistory({
        jobId: emailData.jobId || null,
        recipient: {
          email: emailData.to,
          firstName: emailData.personalizedData?.firstName || '',
          lastName: emailData.personalizedData?.lastName || '',
          fullName: emailData.personalizedData?.fullName || ''
        },
        subject: emailData.subject,
        body: emailData.body,
        attachments: (emailData.attachments || []).map(att => ({
          filename: att.filename || att.name,
          size: att.size,
          contentType: att.contentType || att.type
        })),
        status: 'queued',
        source: emailData.source || 'manual',
        campaign: emailData.campaign || {},
        metadata: {
          originalData: emailData.originalData || {}
        }
      });

      await emailRecord.save();
      logger.info(`Email record created for ${emailData.to} with ID: ${emailRecord._id}`);
      return emailRecord;
    } catch (error) {
      logger.error('Failed to create email record:', error);
      throw error;
    }
  }

  /**
   * Update email status to processing
   */
  async markAsProcessing(jobId) {
    try {
      const record = await EmailHistory.findOne({ jobId });
      if (record) {
        await record.markAsProcessing();
        logger.info(`Email ${jobId} marked as processing`);
      }
      return record;
    } catch (error) {
      logger.error(`Failed to mark email ${jobId} as processing:`, error);
      throw error;
    }
  }

  /**
   * Update email status to sent
   */
  async markAsSent(jobId, messageId, senderInfo = null) {
    try {
      const record = await EmailHistory.findOne({ jobId });
      if (record) {
        record.status = 'sent';
        record.sentAt = new Date();
        record.messageId = messageId;
        
        // Add sender information if provided
        if (senderInfo) {
          record.sender = senderInfo;
        }
        
        await record.save();
        logger.info(`Email ${jobId} marked as sent with messageId: ${messageId}`);
      }
      return record;
    } catch (error) {
      logger.error(`Failed to mark email ${jobId} as sent:`, error);
      throw error;
    }
  }

  /**
   * Update email status to failed
   */
  async markAsFailed(jobId, error, senderInfo = null) {
    try {
      const record = await EmailHistory.findOne({ jobId });
      if (record) {
        record.status = 'failed';
        record.failedAt = new Date();
        record.error = {
          message: error.message,
          code: error.code,
          details: error.stack
        };
        record.delivery.attempts += 1;
        record.delivery.lastAttempt = new Date();
        
        // Add sender information if provided
        if (senderInfo) {
          record.sender = senderInfo;
        }
        
        await record.save();
        logger.info(`Email ${jobId} marked as failed: ${error.message}`);
      }
      return record;
    } catch (error) {
      logger.error(`Failed to mark email ${jobId} as failed:`, error);
      throw error;
    }
  }

  /**
   * Get email history with pagination and filters
   */
  async getEmailHistory(filters = {}, page = 1, limit = 50) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.email) {
        query['recipient.email'] = new RegExp(filters.email, 'i');
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }
      if (filters.source) {
        query.source = filters.source;
      }

      const skip = (page - 1) * limit;
      
      const [emails, total] = await Promise.all([
        EmailHistory.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        EmailHistory.countDocuments(query)
      ]);

      return {
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get email history:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(dateRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const [statusStats, dailyStats, recentEmails] = await Promise.all([
        EmailHistory.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        EmailHistory.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]),
        EmailHistory.find().sort({ createdAt: -1 }).limit(10).lean()
      ]);

      // Convert status stats to object
      const statusStatsObj = {};
      statusStats.forEach(stat => {
        statusStatsObj[stat._id] = stat.count;
      });

      return {
        statusStats: statusStatsObj,
        dailyStats,
        recentEmails,
        totalEmails: await EmailHistory.countDocuments(),
        dateRange
      };
    } catch (error) {
      logger.error('Failed to get email stats:', error);
      throw error;
    }
  }

  /**
   * Get emails by recipient
   */
  async getEmailsByRecipient(email, limit = 50) {
    try {
      return await EmailHistory.getEmailsByRecipient(email, limit);
    } catch (error) {
      logger.error(`Failed to get emails for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create email campaign
   */
  async createCampaign(campaignData) {
    try {
      const campaign = new EmailCampaign(campaignData);
      await campaign.save();
      logger.info(`Campaign created: ${campaign.name} (ID: ${campaign._id})`);
      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats() {
    try {
      const [campaigns, totalCampaigns] = await Promise.all([
        EmailCampaign.find().sort({ createdAt: -1 }).limit(10).lean(),
        EmailCampaign.countDocuments()
      ]);

      return {
        campaigns,
        totalCampaigns
      };
    } catch (error) {
      logger.error('Failed to get campaign stats:', error);
      throw error;
    }
  }
}

module.exports = new EmailHistoryService();