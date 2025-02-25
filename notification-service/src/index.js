import express from 'express';
import { PubSub } from '@google-cloud/pubsub';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure logging
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
  },
  debug: (message, meta = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }));
    }
  }
};

// Configure database connection
const pool = new Pool({
  host: process.env.NODE_ENV === 'production' 
    ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` 
    : process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // Enable SSL in production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Configure PubSub
const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const NOTIFICATION_SUBSCRIPTION = process.env.NOTIFICATION_SUBSCRIPTION || 'boe-analysis-notifications-sub';

// Function to store notification in database
async function storeNotification(data) {
  const client = await pool.connect();
  try {
    logger.debug('Starting transaction for notification storage');
    await client.query('BEGIN');

    // Validate the notification data
    if (!data.userId || !data.subscriptionId) {
      throw new Error('Missing required fields: userId or subscriptionId');
    }

    // Insert the notification into the database
    await client.query(`
      INSERT INTO notifications (
        user_id,
        subscription_id,
        title,
        content,
        source_url,
        metadata,
        read,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      data.userId,
      data.subscriptionId,
      data.title || 'New notification',
      data.content || 'You have a new notification',
      data.sourceUrl || '',
      data.metadata || {},
      false,
      new Date()
    ]);

    await client.query('COMMIT');
    logger.info('Successfully stored notification in database', {
      userId: data.userId,
      subscriptionId: data.subscriptionId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to store notification in database', {
      error: error.message,
      userId: data.userId,
      subscriptionId: data.subscriptionId
    });
    throw error;
  } finally {
    client.release();
  }
}

// Function to start the PubSub subscriber
async function startNotificationSubscriber() {
  const subscription = pubsub.subscription(NOTIFICATION_SUBSCRIPTION);

  subscription.on('message', async (message) => {
    try {
      logger.info('Received notification message', { messageId: message.id });
      
      const data = JSON.parse(message.data.toString());
      
      // Process and store the notification
      await storeNotification(data);
      
      // Acknowledge the message
      message.ack();
      logger.info('Successfully processed notification message', { messageId: message.id });
    } catch (error) {
      logger.error('Failed to process notification message', { 
        messageId: message.id, 
        error: error.message 
      });
      
      // Don't acknowledge the message to allow retry
      message.nack();
    }
  });

  subscription.on('error', (error) => {
    logger.error('Notification subscription error', { error: error.message });
  });

  logger.info('Started notification subscriber', { subscription: NOTIFICATION_SUBSCRIPTION });
}

// API endpoints for health check and diagnostics
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.status(200).json({
      status: 'healthy',
      dbConnected: true,
      pubsubConnected: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server and initialize subscribers
app.listen(port, async () => {
  logger.info(`Notification service listening on port ${port}`);
  
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection successful');
    
    // Start PubSub subscriber
    await startNotificationSubscriber();
    
    logger.info('Notification service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize notification service', { error: error.message });
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
}); 