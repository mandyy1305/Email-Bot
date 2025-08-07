#!/usr/bin/env node

const Queue = require('bull');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const databaseService = require('../services/databaseService');

class EmailWorker {
  constructor() {
    this.redisClient = new Redis(config.redis);
    this.emailQueue = new Queue('email-queue', {
      redis: config.redis,
      defaultJobOptions: {
        attempts: config.queue.emailQueue.attempts,
        backoff: config.queue.emailQueue.backoff,
        removeOnComplete: config.queue.emailQueue.removeOnComplete,
        removeOnFail: config.queue.emailQueue.removeOnFail,
      },
      limiter: {
        max: config.queue.rateLimiting.max,
        duration: config.queue.rateLimiting.duration,
      }
    });

    this.initializeWorker();
  }

  async initializeWorker() {
    try {
      // Connect to database first
      await databaseService.connect();
      logger.info('✅ Worker database connected successfully');
      
      // Setup queue events and start processing
      this.setupQueueEvents();
      this.startProcessing();
    } catch (error) {
      logger.error('Failed to initialize worker:', error);
      process.exit(1);
    }
  }

  setupQueueEvents() {
    this.emailQueue.on('global:completed', (jobId, result) => {
      logger.info(`Job ${jobId} completed: ${JSON.stringify(result)}`);
    });

    this.emailQueue.on('global:failed', (jobId, err) => {
      logger.error(`Job ${jobId} failed: ${err}`);
    });

    this.emailQueue.on('global:active', (jobId) => {
      logger.info(`Job ${jobId} started processing.`);
    });

    this.emailQueue.on('global:stalled', (jobId) => {
      logger.warn(`Job ${jobId} stalled.`);
    });

    this.emailQueue.on('global:error', (error) => {
      logger.error(`Queue error: ${error.message}`);
    });

    this.emailQueue.on('global:waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting.`);
    });

    this.emailQueue.on('global:drained', () => {
      logger.info('Email queue drained.');
    });
  }

  async startProcessing() {
    logger.info('Starting email worker...');

    this.emailQueue.process('sendEmail', async (job) => {
      const { to, subject, body, attachments, personalizedData } = job.data;
      
      try {
        // Personalize content if personalizedData is provided
        let personalizedSubject = subject;
        let personalizedBody = body;
        
        if (personalizedData) {
          personalizedSubject = emailService.personalizeContent(subject, personalizedData);
          personalizedBody = emailService.personalizeContent(body, personalizedData);
        }

        // Send the email
        const result = await emailService.sendEmail({
          to,
          subject: personalizedSubject,
          body: personalizedBody,
          attachments: attachments || [],
          jobId: job.id.toString(),
          personalizedData,
          source: job.data.source || 'manual'
        });

        if (result.success) {
          logger.info(`Email sent successfully to ${to}`);
          return {
            success: true,
            messageId: result.messageId,
            recipient: to
          };
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        logger.error(`Failed to send email to ${to}: ${error.message}`);
        throw error;
      }
    });

    logger.info('Email worker started and ready to process jobs');
  }

  async close() {
    await this.emailQueue.close();
    await this.redisClient.quit();
    logger.info('Email worker closed');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down email worker...');
  if (worker) {
    await worker.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down email worker...');
  if (worker) {
    await worker.close();
  }
  process.exit(0);
});

// Start the worker
const worker = new EmailWorker();

module.exports = worker;