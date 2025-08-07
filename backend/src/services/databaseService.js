const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      const mongoUri = config.database.uri;
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('✅ Database connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const EmailHistory = require('../models/EmailHistory');
      const EmailCampaign = require('../models/EmailCampaign');

      const [emailCount, campaignCount, recentEmails] = await Promise.all([
        EmailHistory.countDocuments(),
        EmailCampaign.countDocuments(),
        EmailHistory.find().sort({ createdAt: -1 }).limit(10).lean()
      ]);

      return {
        isConnected: this.isHealthy(),
        collections: {
          emailHistory: emailCount,
          emailCampaigns: campaignCount
        },
        recentEmails: recentEmails.length,
        connectionState: mongoose.connection.readyState
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return {
        isConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old records
   */
  async cleanup(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const EmailHistory = require('../models/EmailHistory');
      
      const result = await EmailHistory.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['sent', 'failed'] }
      });

      logger.info(`Cleaned up ${result.deletedCount} old email records`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error during database cleanup:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();