const EmailJob = require('../models/EmailJob');
const logger = require('../utils/logger');

/**
 * In-memory store for email jobs
 * In production, this would be replaced with a database implementation
 */
class EmailJobStore {
  constructor() {
    this.jobs = new Map();
    this.userJobs = new Map(); // userId -> Set of jobIds
  }

  /**
   * Create a new email job
   */
  async create(jobData) {
    try {
      const job = new EmailJob(jobData);
      const validation = job.validate();
      
      if (!validation.isValid) {
        throw new Error(`Invalid job data: ${validation.errors.join(', ')}`);
      }

      this.jobs.set(job.id, job);
      
      // Index by user
      if (job.userId) {
        if (!this.userJobs.has(job.userId)) {
          this.userJobs.set(job.userId, new Set());
        }
        this.userJobs.get(job.userId).add(job.id);
      }

      logger.info(`Created email job ${job.id} for user ${job.userId}`);
      return job;
    } catch (error) {
      logger.error('Failed to create email job:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async findById(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get job by ID and user ID
   */
  async findByIdAndUser(jobId, userId) {
    const job = this.jobs.get(jobId);
    
    if (!job || job.userId !== userId) {
      return null;
    }
    
    return job;
  }

  /**
   * Update job
   */
  async update(jobId, updates) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') { // Prevent updating immutable fields
        job[key] = updates[key];
      }
    });

    job.updatedAt = new Date();
    
    logger.info(`Updated email job ${jobId}`);
    return job;
  }

  /**
   * Update job status
   */
  async updateStatus(jobId, status, metadata = {}) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    job.updateStatus(status, metadata);
    
    logger.info(`Updated job ${jobId} status to ${status}`);
    return job;
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, successCount, failureCount) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    job.updateProgress(successCount, failureCount);
    
    return job;
  }

  /**
   * Add error to job
   */
  async addError(jobId, error) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    job.addError(error);
    
    return job;
  }

  /**
   * Delete job
   */
  async delete(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return false;
    }

    // Remove from user index
    if (job.userId && this.userJobs.has(job.userId)) {
      this.userJobs.get(job.userId).delete(jobId);
      
      // Clean up empty user sets
      if (this.userJobs.get(job.userId).size === 0) {
        this.userJobs.delete(job.userId);
      }
    }

    this.jobs.delete(jobId);
    
    logger.info(`Deleted email job ${jobId}`);
    return true;
  }

  /**
   * Find jobs by user with pagination
   */
  async findByUser(userId, { page = 1, limit = 10, status = null } = {}) {
    const userJobIds = this.userJobs.get(userId) || new Set();
    let jobs = Array.from(userJobIds)
      .map(jobId => this.jobs.get(jobId))
      .filter(job => job !== undefined);

    // Filter by status if provided
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const total = jobs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    return {
      data: paginatedJobs.map(job => job.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find active jobs (queued or processing)
   */
  async findActive() {
    return Array.from(this.jobs.values())
      .filter(job => job.isActive())
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Find jobs by status
   */
  async findByStatus(status) {
    return Array.from(this.jobs.values())
      .filter(job => job.status === status)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Get store statistics
   */
  async getStats() {
    const jobs = Array.from(this.jobs.values());
    
    const stats = {
      total: jobs.length,
      byStatus: {},
      activeJobs: 0,
      completedJobs: 0,
      totalRecipients: 0,
      totalSuccessful: 0,
      totalFailed: 0,
    };

    jobs.forEach(job => {
      // Count by status
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
      
      // Count active vs completed
      if (job.isActive()) {
        stats.activeJobs++;
      } else if (job.isCompleted()) {
        stats.completedJobs++;
      }
      
      // Aggregate recipient stats
      stats.totalRecipients += job.totalRecipients;
      stats.totalSuccessful += job.successCount;
      stats.totalFailed += job.failureCount;
    });

    return stats;
  }

  /**
   * Clean up old completed jobs (for memory management)
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoffDate = new Date(Date.now() - maxAge);
    const jobsToDelete = [];

    this.jobs.forEach((job, jobId) => {
      if (job.isCompleted() && job.completedAt < cutoffDate) {
        jobsToDelete.push(jobId);
      }
    });

    for (const jobId of jobsToDelete) {
      await this.delete(jobId);
    }

    if (jobsToDelete.length > 0) {
      logger.info(`Cleaned up ${jobsToDelete.length} old email jobs`);
    }

    return jobsToDelete.length;
  }

  /**
   * Get all jobs (admin function)
   */
  async findAll({ page = 1, limit = 10, status = null } = {}) {
    let jobs = Array.from(this.jobs.values());

    // Filter by status if provided
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const total = jobs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    return {
      data: paginatedJobs.map(job => job.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

// Export singleton instance
module.exports = new EmailJobStore();