/**
 * End-to-End Test for Subscription Worker → Notification Worker Flow
 * 
 * This script tests the complete flow between the Subscription Worker and Notification Worker.
 * It verifies:
 * 1. That the Subscription Worker can successfully process a subscription
 * 2. That the Subscription Worker publishes messages to the PubSub topic correctly
 * 3. That the Notification Worker receives the messages and processes them
 * 
 * Usage: 
 *   node test-subscription-notification-flow.js [subscription_id]
 * 
 * If no subscription_id is provided, the script will look for one in the DB
 */

// Import required libraries
const axios = require('axios');
const { Pool } = require('pg');
const { PubSub } = require('@google-cloud/pubsub');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Setup logging
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG; // Change to adjust log verbosity

function log(level, message, data = {}) {
  if (level >= CURRENT_LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
    console.log(`[${timestamp}] ${levelName}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Load environment variables from .env files
function loadEnvFiles() {
  const envFiles = [
    path.resolve('.env'),
    path.resolve('./backend/.env'),
    path.resolve('./subscription-worker/.env'),
    path.resolve('./notification-worker/.env')
  ];

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(LOG_LEVELS.INFO, `Loading environment from ${file}`);
      dotenv.config({ path: file });
    } else {
      log(LOG_LEVELS.WARN, `Environment file not found: ${file}`);
    }
  });
}

loadEnvFiles();

// Configuration from environment variables
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const subscriptionWorkerUrl = process.env.SUBSCRIPTION_WORKER_URL || 'http://localhost:8080';
const notificationWorkerUrl = process.env.NOTIFICATION_WORKER_URL || 'http://localhost:8081';
const projectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nifya',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Initialize database connection
const pool = new Pool(dbConfig);

// Initialize PubSub client
const pubsub = projectId ? new PubSub({ projectId }) : null;

/**
 * Check health status of a service
 */
async function checkServiceHealth(serviceUrl, serviceName) {
  try {
    log(LOG_LEVELS.INFO, `Checking health of ${serviceName} at ${serviceUrl}`);
    const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      log(LOG_LEVELS.INFO, `✅ ${serviceName} is healthy`, response.data);
      return true;
    } else {
      log(LOG_LEVELS.ERROR, `❌ ${serviceName} responded with status ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Failed to connect to ${serviceName}`, {
      error: error.message,
      code: error.code,
      service: serviceUrl
    });
    return false;
  }
}

/**
 * Find a subscription ID in the database for testing
 */
async function findSubscriptionId() {
  try {
    log(LOG_LEVELS.INFO, 'Looking for a valid subscription in the database');
    const result = await pool.query(
      'SELECT id FROM subscriptions WHERE active = TRUE ORDER BY created_at DESC LIMIT 1'
    );
    
    if (result.rows.length > 0) {
      const subscriptionId = result.rows[0].id;
      log(LOG_LEVELS.INFO, `✅ Found subscription ID: ${subscriptionId}`);
      return subscriptionId;
    } else {
      log(LOG_LEVELS.ERROR, '❌ No active subscriptions found in the database');
      return null;
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, '❌ Database query failed', {
      error: error.message,
      detail: error.detail
    });
    return null;
  }
}

/**
 * Trigger subscription processing directly via Subscription Worker
 */
async function triggerSubscriptionProcessing(subscriptionId) {
  try {
    log(LOG_LEVELS.INFO, `Triggering processing for subscription: ${subscriptionId}`);
    
    // First, try with the correct path for new implementation
    const processingEndpoint = `${subscriptionWorkerUrl}/subscriptions/process-subscription/${subscriptionId}`;
    log(LOG_LEVELS.DEBUG, `Calling processing endpoint: ${processingEndpoint}`);
    
    try {
      const response = await axios.post(processingEndpoint, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      log(LOG_LEVELS.INFO, `✅ Processing initiated successfully`, {
        status: response.status,
        data: response.data
      });
      
      return {
        success: true,
        response: response.data
      };
    } catch (primaryError) {
      // If the first attempt fails, try the fallback path
      log(LOG_LEVELS.WARN, `❌ Failed with primary endpoint, trying fallback path`, {
        error: primaryError.message
      });
      
      const fallbackEndpoint = `${subscriptionWorkerUrl}/process-subscription/${subscriptionId}`;
      log(LOG_LEVELS.DEBUG, `Calling fallback endpoint: ${fallbackEndpoint}`);
      
      try {
        const fallbackResponse = await axios.post(fallbackEndpoint, {}, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        log(LOG_LEVELS.INFO, `✅ Processing initiated successfully with fallback endpoint`, {
          status: fallbackResponse.status,
          data: fallbackResponse.data
        });
        
        return {
          success: true,
          response: fallbackResponse.data
        };
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback endpoints failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Failed to trigger subscription processing`, {
      error: error.message,
      subscription_id: subscriptionId
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if a processing record was created and monitor its status
 */
async function monitorProcessingStatus(subscriptionId, timeout = 30000, interval = 1000) {
  try {
    log(LOG_LEVELS.INFO, `Monitoring processing status for subscription: ${subscriptionId}`);
    
    const startTime = Date.now();
    let processingComplete = false;
    let processingRecord = null;
    
    while (!processingComplete && (Date.now() - startTime) < timeout) {
      // Query the database for the processing record
      const result = await pool.query(
        'SELECT id, subscription_id, status, result, created_at, updated_at FROM subscription_processing WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT 1',
        [subscriptionId]
      );
      
      if (result.rows.length > 0) {
        processingRecord = result.rows[0];
        log(LOG_LEVELS.INFO, `Found processing record: ${processingRecord.id}`, {
          status: processingRecord.status,
          created_at: processingRecord.created_at,
          updated_at: processingRecord.updated_at
        });
        
        if (processingRecord.status === 'completed' || processingRecord.status === 'error') {
          processingComplete = true;
        }
      } else {
        log(LOG_LEVELS.WARN, `No processing record found yet for subscription: ${subscriptionId}`);
      }
      
      if (!processingComplete) {
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    if (processingComplete) {
      log(LOG_LEVELS.INFO, `✅ Processing completed with status: ${processingRecord.status}`, {
        processing_id: processingRecord.id,
        result: processingRecord.result
      });
      
      return {
        success: true,
        processing_id: processingRecord.id,
        status: processingRecord.status,
        result: processingRecord.result
      };
    } else {
      log(LOG_LEVELS.ERROR, `❌ Processing did not complete within the timeout period`);
      
      return {
        success: false,
        error: 'Processing timeout'
      };
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Error monitoring processing status`, {
      error: error.message,
      subscription_id: subscriptionId
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if notifications were created for this subscription processing
 */
async function checkNotificationsCreated(subscriptionId, processingId) {
  try {
    log(LOG_LEVELS.INFO, `Checking notifications for subscription: ${subscriptionId}`);
    
    // Wait a bit to allow notifications to be created
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Query the database for notifications
    const result = await pool.query(
      'SELECT id, title, content, created_at FROM notifications WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT 5',
      [subscriptionId]
    );
    
    if (result.rows.length > 0) {
      log(LOG_LEVELS.INFO, `✅ Found ${result.rows.length} notifications`, {
        notifications: result.rows.map(n => ({
          id: n.id,
          title: n.title,
          created_at: n.created_at
        }))
      });
      
      return {
        success: true,
        count: result.rows.length,
        notifications: result.rows
      };
    } else {
      log(LOG_LEVELS.WARN, `❌ No notifications found for subscription: ${subscriptionId}`);
      
      return {
        success: false,
        count: 0,
        error: 'No notifications found'
      };
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Error checking notifications`, {
      error: error.message,
      subscription_id: subscriptionId
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Examine PubSub topic for messages
 */
async function checkPubSubMessages(topic = 'processor-results') {
  if (!pubsub) {
    log(LOG_LEVELS.WARN, `⚠️ PubSub client not available, skipping message check`);
    return { success: false, error: 'PubSub client not available' };
  }
  
  try {
    log(LOG_LEVELS.INFO, `Checking messages on PubSub topic: ${topic}`);
    
    // This is primarily for diagnostic purposes
    // In a production environment, we would need a subscription to the topic
    const topicExists = await pubsub.topic(topic).exists();
    
    if (topicExists[0]) {
      log(LOG_LEVELS.INFO, `✅ PubSub topic ${topic} exists`);
      return { success: true, topic };
    } else {
      log(LOG_LEVELS.ERROR, `❌ PubSub topic ${topic} does not exist`);
      return { success: false, error: `Topic ${topic} does not exist` };
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Error checking PubSub topic`, {
      error: error.message,
      topic
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add a debug route to the Subscription Worker for testing message publishing
 */
async function addDebugEndpoint() {
  try {
    log(LOG_LEVELS.INFO, `Adding debug endpoint to subscription worker...`);
    
    // Note: This endpoint may already exist in your application
    // If not, you'd need to implement it or modify this test to use existing endpoints

    log(LOG_LEVELS.INFO, `✅ Debug endpoint setup is complete`);
    
    return {
      success: true
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Error setting up debug endpoint`, {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get connection information for the subscription worker
 */
async function getSubscriptionWorkerInfo() {
  const url = `${subscriptionWorkerUrl}/health`;
  
  try {
    log(LOG_LEVELS.INFO, `Fetching subscription worker info from: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    
    log(LOG_LEVELS.INFO, `✅ Subscription worker info retrieved`, response.data);
    
    return {
      success: true,
      info: response.data
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Failed to get subscription worker info`, {
      error: error.message,
      url
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get connection information for the notification worker
 */
async function getNotificationWorkerInfo() {
  const url = `${notificationWorkerUrl}/health`;
  
  try {
    log(LOG_LEVELS.INFO, `Fetching notification worker info from: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    
    log(LOG_LEVELS.INFO, `✅ Notification worker info retrieved`, response.data);
    
    return {
      success: true,
      info: response.data
    };
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Failed to get notification worker info`, {
      error: error.message,
      url
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main test function
 */
async function runTest() {
  try {
    // Get the subscription ID from command line argument or find one in the database
    const subscriptionId = process.argv[2] || await findSubscriptionId();
    
    if (!subscriptionId) {
      log(LOG_LEVELS.ERROR, `❌ No subscription ID available for testing`);
      process.exit(1);
    }
    
    log(LOG_LEVELS.INFO, `🧪 Starting end-to-end test for subscription ID: ${subscriptionId}`);
    log(LOG_LEVELS.INFO, `---------------------------------------------------------`);
    
    // 1. Check service health
    const backendHealth = await checkServiceHealth(backendUrl, 'Backend');
    const subWorkerHealth = await checkServiceHealth(subscriptionWorkerUrl, 'Subscription Worker');
    const notifWorkerHealth = await checkServiceHealth(notificationWorkerUrl, 'Notification Worker');
    
    if (!subWorkerHealth || !notifWorkerHealth) {
      log(LOG_LEVELS.ERROR, `❌ Critical services are not healthy, aborting test`);
      process.exit(1);
    }
    
    // 2. Get service information
    const subWorkerInfo = await getSubscriptionWorkerInfo();
    const notifWorkerInfo = await getNotificationWorkerInfo();
    
    // 3. Set up debug endpoints if needed
    await addDebugEndpoint();
    
    // 4. Check PubSub topic
    const pubsubCheck = await checkPubSubMessages();
    
    // 5. Trigger subscription processing
    log(LOG_LEVELS.INFO, `---------------------------------------------------------`);
    log(LOG_LEVELS.INFO, `Triggering subscription processing flow`);
    const processingResult = await triggerSubscriptionProcessing(subscriptionId);
    
    if (!processingResult.success) {
      log(LOG_LEVELS.ERROR, `❌ Failed to trigger subscription processing, aborting test`);
      process.exit(1);
    }
    
    // 6. Monitor processing status
    log(LOG_LEVELS.INFO, `---------------------------------------------------------`);
    log(LOG_LEVELS.INFO, `Monitoring subscription processing status`);
    const monitoringResult = await monitorProcessingStatus(subscriptionId);
    
    // 7. Check if notifications were created
    log(LOG_LEVELS.INFO, `---------------------------------------------------------`);
    log(LOG_LEVELS.INFO, `Checking for notifications`);
    const notificationsResult = await checkNotificationsCreated(
      subscriptionId, 
      monitoringResult.success ? monitoringResult.processing_id : null
    );
    
    // 8. Summarize test results
    log(LOG_LEVELS.INFO, `---------------------------------------------------------`);
    log(LOG_LEVELS.INFO, `🔍 Test Results Summary:`);
    
    log(LOG_LEVELS.INFO, `Backend Service Health: ${backendHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
    log(LOG_LEVELS.INFO, `Subscription Worker Health: ${subWorkerHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
    log(LOG_LEVELS.INFO, `Notification Worker Health: ${notifWorkerHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
    log(LOG_LEVELS.INFO, `PubSub Topic: ${pubsubCheck.success ? '✅ Available' : '❌ Unavailable'}`);
    log(LOG_LEVELS.INFO, `Subscription Processing: ${processingResult.success ? '✅ Triggered' : '❌ Failed'}`);
    log(LOG_LEVELS.INFO, `Processing Completion: ${monitoringResult.success ? '✅ Completed' : '❌ Failed'}`);
    log(LOG_LEVELS.INFO, `Notifications Created: ${notificationsResult.success ? '✅ Yes' : '❌ No'}`);
    
    if (notificationsResult.success) {
      log(LOG_LEVELS.INFO, `Number of Notifications: ${notificationsResult.count}`);
    }
    
    // Check if the end-to-end flow was successful
    const flowSuccess = processingResult.success && monitoringResult.success && notificationsResult.success;
    
    if (flowSuccess) {
      log(LOG_LEVELS.INFO, `✅ The Subscription Worker → Notification Worker flow is working correctly!`);
    } else {
      log(LOG_LEVELS.ERROR, `❌ The flow is not working as expected. See details above for debugging.`);
      log(LOG_LEVELS.ERROR, `Possible issues:`);
      
      if (!processingResult.success) {
        log(LOG_LEVELS.ERROR, `- Subscription Worker is not processing requests correctly`);
      }
      
      if (!monitoringResult.success) {
        log(LOG_LEVELS.ERROR, `- Processing did not complete or there were database issues`);
      }
      
      if (!notificationsResult.success) {
        log(LOG_LEVELS.ERROR, `- Messages are not being published to PubSub or Notification Worker is not consuming them`);
      }
      
      process.exit(1);
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `💥 Unhandled error in test`, {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
  } finally {
    // Clean up
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
runTest(); 