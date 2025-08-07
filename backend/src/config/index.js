require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@emailbot.com',
    senderName: process.env.EMAIL_SENDER_NAME || 'Email Bot',
    // Multiple users configuration
    users: process.env.SMTP_USERS ? JSON.parse(process.env.SMTP_USERS) : [],
  },

  // File Upload Configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['xlsx', 'xls', 'csv'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
    maxRetriesPerRequest: null,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
  },

  // Queue Configuration
  queue: {
    emailQueue: {
      name: 'email-queue',
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 1,
      attempts: parseInt(process.env.QUEUE_ATTEMPTS) || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE) || 50,
      removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL) || 50,
    },
    rateLimiting: {
      max: parseInt(process.env.QUEUE_RATE_LIMIT_MAX) || 10, // emails per interval
      duration: parseInt(process.env.QUEUE_RATE_LIMIT_DURATION) || 60000, // 1 minute
    },
    delay: {
      betweenEmails: parseInt(process.env.EMAIL_DELAY_SECONDS) || 5, // seconds between emails (for backwards compatibility)
      minDelay: parseInt(process.env.EMAIL_DELAY_MIN_SECONDS) || parseInt(process.env.EMAIL_DELAY_SECONDS) || 5, // minimum delay
      maxDelay: parseInt(process.env.EMAIL_DELAY_MAX_SECONDS) || parseInt(process.env.EMAIL_DELAY_SECONDS) || 15, // maximum delay
    },
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/email-bot',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  },
};

// Validate required environment variables in production
if (config.server.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn about missing email configuration but don't fail
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️  Warning: SMTP_USER and SMTP_PASSWORD are not set. Email functionality will be limited.');
  }
}

module.exports = config;