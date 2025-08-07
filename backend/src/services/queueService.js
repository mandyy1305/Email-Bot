const Queue = require('bull');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/ApiError');
const emailHistoryService = require('./emailHistoryService');

class QueueService {
  constructor() {
    this.redis = null;
    this.emailQueue = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Redis connection and queues
   */
  async initialize() {
    try {
      // Initialize Redis connection
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        enableReadyCheck: config.redis.enableReadyCheck,
        lazyConnect: true,
      });

      // Test Redis connection
      await this.redis.connect();
      logger.info('✅ Redis connection established');

      // Initialize email queue
      this.emailQueue = new Queue(config.queue.emailQueue.name, {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
        },
        defaultJobOptions: {
          attempts: config.queue.emailQueue.attempts,
          backoff: config.queue.emailQueue.backoff,
          removeOnComplete: config.queue.emailQueue.removeOnComplete,
          removeOnFail: config.queue.emailQueue.removeOnFail,
        },
      });

      // Set up queue event listeners
      this.setupQueueEventListeners();

      this.isInitialized = true;
      logger.info('✅ Queue service initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize queue service:', error);
      throw new ApiError(500, 'Queue service initialization failed');
    }
  }

  /**
   * Set up event listeners for the email queue
   */
  setupQueueEventListeners() {
    this.emailQueue.on('ready', () => {
      logger.info('📧 Email queue is ready');
    });

    this.emailQueue.on('error', (error) => {
      logger.error('📧 Email queue error:', error);
    });

    this.emailQueue.on('waiting', (jobId) => {
      logger.debug(`📧 Job ${jobId} is waiting`);
    });

    this.emailQueue.on('active', (job) => {
      logger.info(`📧 Job ${job.id} started processing`);
    });

    this.emailQueue.on('completed', (job, result) => {
      logger.info(`📧 Job ${job.id} completed:`, result);
    });

    this.emailQueue.on('failed', (job, error) => {
      logger.error(`📧 Job ${job.id} failed:`, error);
    });

    this.emailQueue.on('stalled', (job) => {
      logger.warn(`📧 Job ${job.id} stalled`);
    });
  }

  /**
   * Add individual email to queue
   */
  async addEmailToQueue(emailData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const jobOptions = {
        delay: options.delay || 0,
        priority: options.priority || 0,
        ...options,
      };

      const job = await this.emailQueue.add('sendEmail', emailData, jobOptions);
      
      // Create database record for email tracking
      try {
        await emailHistoryService.createEmailRecord({
          jobId: job.id.toString(),
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          attachments: emailData.attachments || [],
          personalizedData: emailData.personalizedData || {},
          source: emailData.source || 'manual'
        });
      } catch (dbError) {
        logger.warn(`Failed to create database record for job ${job.id}:`, dbError);
      }
      
      logger.info(`📧 Email job ${job.id} added to queue for ${emailData.to}`);
      
      return {
        jobId: job.id,
        status: 'queued',
        recipient: emailData.to,
        queuedAt: new Date(),
      };

    } catch (error) {
      logger.error('Failed to add email to queue:', error);
      throw new ApiError(500, 'Failed to queue email');
    }
  }

  /**
   * Add bulk emails to queue with controlled rate limiting
   */
  async addBulkEmailsToQueue(emailsData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const jobs = [];
      const delayBetweenEmails = (config.queue.delay.betweenEmails || 5) * 1000; // Convert to milliseconds
      let currentDelay = 0;

      for (let i = 0; i < emailsData.length; i++) {
        const emailData = emailsData[i];
        
        // Calculate delay for rate limiting
        currentDelay = i * delayBetweenEmails;
        
        const jobOptions = {
          delay: currentDelay,
          priority: options.priority || 0,
          attempts: config.queue.emailQueue.attempts,
          backoff: config.queue.emailQueue.backoff,
        };

        const job = await this.emailQueue.add('sendEmail', emailData, jobOptions);
        
        jobs.push({
          jobId: job.id,
          recipient: emailData.to,
          scheduledFor: new Date(Date.now() + currentDelay),
        });
      }

      logger.info(`📧 Added ${jobs.length} emails to queue with ${delayBetweenEmails/1000}s intervals`);

      return {
        totalJobs: jobs.length,
        jobs: jobs,
        estimatedCompletionTime: new Date(Date.now() + currentDelay + 30000), // +30s buffer
      };

    } catch (error) {
      logger.error('Failed to add bulk emails to queue:', error);
      throw new ApiError(500, 'Failed to queue bulk emails');
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const job = await this.emailQueue.getJob(jobId);
      
      if (!job) {
        return null;
      }

      const jobState = await job.getState();
      
      return {
        id: job.id,
        status: jobState,
        data: job.data,
        progress: job.progress(),
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        createdAt: new Date(job.timestamp),
      };

    } catch (error) {
      logger.error(`Failed to get job status for ${jobId}:`, error);
      throw new ApiError(500, 'Failed to get job status');
    }
  }

  /**
   * Cancel/remove a job
   */
  async cancelJob(jobId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const job = await this.emailQueue.getJob(jobId);
      
      if (!job) {
        return false;
      }

      await job.remove();
      logger.info(`📧 Job ${jobId} cancelled and removed from queue`);
      
      return true;

    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      throw new ApiError(500, 'Failed to cancel job');
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      };

    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw new ApiError(500, 'Failed to get queue statistics');
    }
  }

  /**
   * Pause the queue
   */
  async pauseQueue() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.emailQueue.pause();
    logger.info('📧 Email queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.emailQueue.resume();
    logger.info('📧 Email queue resumed');
  }

  /**
   * Clean completed/failed jobs
   */
  async cleanQueue(grace = 24 * 60 * 60 * 1000) { // 24 hours
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.emailQueue.clean(grace, 'completed');
      await this.emailQueue.clean(grace, 'failed');
      
      logger.info('📧 Queue cleaned successfully');
    } catch (error) {
      logger.error('Failed to clean queue:', error);
    }
  }

  /**
   * Get queue health status
   */
  async getHealth() {
    try {
      if (!this.isInitialized) {
        return { status: 'error', message: 'Queue not initialized' };
      }

      // Test Redis connection
      await this.redis.ping();
      
      // Get queue stats
      const stats = await this.getQueueStats();
      
      return {
        status: 'healthy',
        message: 'Queue service operational',
        redis: 'connected',
        stats,
      };

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        redis: 'disconnected',
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.emailQueue) {
        await this.emailQueue.close();
        logger.info('📧 Email queue closed');
      }
      
      if (this.redis) {
        await this.redis.disconnect();
        logger.info('📧 Redis connection closed');
      }
      
      this.isInitialized = false;
      logger.info('📧 Queue service shutdown complete');

    } catch (error) {
      logger.error('Error during queue service shutdown:', error);
    }
  }
}

// Export singleton instance
module.exports = new QueueService();