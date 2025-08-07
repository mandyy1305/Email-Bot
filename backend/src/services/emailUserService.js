const config = require('../config');
const logger = require('../utils/logger');

class EmailUserService {
  constructor() {
    this.users = [];
    this.loadUsers();
  }

  /**
   * Load users from configuration
   */
  loadUsers() {
    try {
      // Load users from SMTP_USERS environment variable if available
      if (config.email.users && config.email.users.length > 0) {
        this.users = this.parseUsers(config.email.users);
        logger.info(`📧 Loaded ${this.users.length} SMTP users from configuration`);
      } else {
        // Fallback to single user from individual environment variables
        const singleUser = {
          email: config.email.from,
          password: process.env.SMTP_PASSWORD,
          name: config.email.senderName,
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure
        };
        
        if (singleUser.email && singleUser.password) {
          this.users = [singleUser];
          logger.info('📧 Using single SMTP user from environment variables');
        } else {
          logger.warn('⚠️ No SMTP users configured');
          this.users = [];
        }
      }
    } catch (error) {
      logger.error('Failed to load SMTP users:', error);
      this.users = [];
    }
  }

  /**
   * Parse users from configuration array
   */
  parseUsers(userConfigs) {
    return userConfigs.map((userConfig, index) => {
      // Support both object format and string format
      if (typeof userConfig === 'string') {
        // Format: "email:password:name"
        const [email, password, name] = userConfig.split(':');
        return {
          id: `user_${index + 1}`,
          email: email?.trim(),
          password: password?.trim(),
          name: name?.trim() || email?.split('@')[0] || `User ${index + 1}`,
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure
        };
      } else {
        // Object format
        return {
          id: userConfig.id || `user_${index + 1}`,
          email: userConfig.email,
          password: userConfig.password,
          name: userConfig.name || userConfig.email?.split('@')[0] || `User ${index + 1}`,
          host: userConfig.host || config.email.smtp.host,
          port: userConfig.port || config.email.smtp.port,
          secure: userConfig.secure !== undefined ? userConfig.secure : config.email.smtp.secure
        };
      }
    }).filter(user => user.email && user.password); // Only include valid users
  }

  /**
   * Get a random user for sending emails
   */
  getRandomUser() {
    if (this.users.length === 0) {
      logger.error('No SMTP users available');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.users.length);
    const selectedUser = this.users[randomIndex];
    
    logger.debug(`📧 Selected random user: ${selectedUser.email} (${selectedUser.name})`);
    return selectedUser;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  /**
   * Get user by ID
   */
  getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  /**
   * Get all users (without passwords for security)
   */
  getAllUsers() {
    return this.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      host: user.host,
      port: user.port,
      secure: user.secure
      // Password intentionally excluded for security
    }));
  }

  /**
   * Add a new user
   */
  addUser(userConfig) {
    const newUser = {
      id: userConfig.id || `user_${this.users.length + 1}`,
      email: userConfig.email,
      password: userConfig.password,
      name: userConfig.name || userConfig.email?.split('@')[0] || `User ${this.users.length + 1}`,
      host: userConfig.host || config.email.smtp.host,
      port: userConfig.port || config.email.smtp.port,
      secure: userConfig.secure !== undefined ? userConfig.secure : config.email.smtp.secure
    };

    if (!newUser.email || !newUser.password) {
      throw new Error('Email and password are required');
    }

    this.users.push(newUser);
    logger.info(`📧 Added new SMTP user: ${newUser.email}`);
    return newUser.id;
  }

  /**
   * Remove a user by ID
   */
  removeUser(userId) {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== userId);
    
    if (this.users.length < initialLength) {
      logger.info(`📧 Removed SMTP user: ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Update a user
   */
  updateUser(userId, updateData) {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return false;
    }

    // Merge update data with existing user
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      id: userId // Ensure ID doesn't change
    };

    logger.info(`📧 Updated SMTP user: ${userId}`);
    return true;
  }

  /**
   * Get total user count
   */
  getUserCount() {
    return this.users.length;
  }

  /**
   * Reload users from configuration
   */
  reloadUsers() {
    logger.info('📧 Reloading SMTP users from configuration');
    this.loadUsers();
  }
}

// Export singleton instance
module.exports = new EmailUserService();
