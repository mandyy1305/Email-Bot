// MongoDB initialization script
print('Starting MongoDB initialization...');

// Switch to email-bot database
db = db.getSiblingDB('email-bot');

// Create collections with validators
print('Creating email_history collection...');
db.createCollection('email_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['recipient', 'subject', 'body', 'status'],
      properties: {
        recipient: {
          bsonType: 'object',
          required: ['email'],
          properties: {
            email: { bsonType: 'string' },
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            fullName: { bsonType: 'string' }
          }
        },
        subject: { bsonType: 'string' },
        body: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['queued', 'processing', 'sent', 'failed', 'bounced']
        }
      }
    }
  }
});

print('Creating email_campaigns collection...');
db.createCollection('email_campaigns', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'subject', 'body', 'status'],
      properties: {
        name: { bsonType: 'string' },
        subject: { bsonType: 'string' },
        body: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled']
        }
      }
    }
  }
});

// Create indexes for better performance
print('Creating indexes...');

// Email History indexes
db.email_history.createIndex({ 'recipient.email': 1, createdAt: -1 });
db.email_history.createIndex({ status: 1, createdAt: -1 });
db.email_history.createIndex({ queuedAt: -1 });
db.email_history.createIndex({ sentAt: -1 });
db.email_history.createIndex({ jobId: 1 });

// Email Campaigns indexes
db.email_campaigns.createIndex({ status: 1, createdAt: -1 });
db.email_campaigns.createIndex({ createdBy: 1, createdAt: -1 });
db.email_campaigns.createIndex({ scheduledAt: 1 });

print('MongoDB initialization completed successfully!');

// Insert sample data (optional)
print('Inserting sample data...');

// Sample campaign
db.email_campaigns.insertOne({
  name: 'Welcome Campaign',
  description: 'Welcome email for new users',
  subject: 'Welcome to Email Bot!',
  body: '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining us.</p>',
  status: 'draft',
  recipients: [],
  stats: {
    total: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
    opened: 0,
    clicked: 0
  },
  settings: {
    delayBetweenEmails: 5,
    trackOpens: false,
    trackClicks: false
  },
  source: 'manual',
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Sample data inserted!');
print('MongoDB setup complete!');