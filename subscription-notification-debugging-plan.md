# Debugging Plan: Subscription Processing to Notification Delivery

This document outlines a comprehensive debugging plan to trace the flow from manual subscription processing to notification delivery in the user's panel.

## Phase 1: Subscription Processing Initiation

### 1. API Endpoint Logging
```javascript
// Add detailed logging to the manual processing endpoint
logger.debug('Manual subscription processing initiated', { 
  subscriptionId: req.params.id, 
  userId: req.user.id, 
  timestamp: new Date().toISOString() 
});
```

### 2. Request Validation Check
- Verify request parameters and authentication
- Log validation failures with specific error codes

### 3. Transaction Boundary Setup
```javascript
// Add transaction logging to track the entire process
const transactionId = uuidv4();
logger.info('Starting subscription processing transaction', { transactionId });
```

## Phase 2: Database Operations

### 1. Database Query Profiling
```sql
-- Enable query logging temporarily
SET log_min_duration_statement = 0;  -- For PostgreSQL
```

### 2. Transaction Isolation Level Check
```javascript
// Verify correct transaction isolation level
const connection = await pool.getConnection();
await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
```

### 3. Data Integrity Verification
```javascript
// Log subscription state before and after processing
const beforeState = await db.query('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
logger.debug('Subscription state before processing', { beforeState, transactionId });

// After processing
const afterState = await db.query('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
logger.debug('Subscription state after processing', { afterState, transactionId });
```

## Phase 3: Payment Processing

### 1. Payment Gateway Integration Logging
```javascript
// Add detailed logging for payment gateway interactions
logger.debug('Initiating payment gateway request', {
  subscriptionId,
  transactionId,
  gateway: 'PAYMENT_PROVIDER_NAME',
  amount: subscription.amount
});

try {
  const paymentResult = await paymentGateway.processPayment(/*...*/);
  logger.debug('Payment gateway response', { 
    paymentResult, 
    transactionId,
    responseTime: responseTimeMs 
  });
} catch (error) {
  logger.error('Payment gateway error', { 
    error: error.message, 
    errorCode: error.code,
    transactionId 
  });
}
```

### 2. Payment Status Tracking
- Log payment state transitions (pending, processing, completed, failed)
- Track external payment reference IDs

## Phase 4: Notification Generation

### 1. Event Emission Logging
```javascript
// Log when notification events are emitted
logger.debug('Emitting notification event', {
  eventType: 'SUBSCRIPTION_PROCESSED',
  subscriptionId,
  transactionId,
  timestamp: new Date().toISOString()
});
```

### 2. Event Queue Monitoring
```javascript
// If using a message queue (e.g., RabbitMQ, Kafka)
// Add correlation IDs to track messages through the system
await channel.publish('notifications', '', Buffer.from(JSON.stringify({
  type: 'SUBSCRIPTION_PROCESSED',
  payload: { subscriptionId },
  correlationId: transactionId
})));
```

### 3. Notification Service Logging
```javascript
// In the notification service
logger.debug('Notification service received event', {
  eventType: 'SUBSCRIPTION_PROCESSED',
  correlationId: message.correlationId,
  processingTime: new Date().toISOString()
});
```

## Phase 5: Notification Persistence

### 1. Notification Database Operations
```javascript
// Log notification creation in database
const notificationData = {
  userId: subscription.userId,
  type: 'SUBSCRIPTION_PROCESSED',
  content: {
    subscriptionId,
    processedAt: new Date().toISOString()
  },
  read: false
};

logger.debug('Creating notification record', {
  notificationData,
  correlationId: transactionId
});

const result = await db.query(
  'INSERT INTO notifications (user_id, type, content, read) VALUES (?, ?, ?, ?)',
  [notificationData.userId, notificationData.type, JSON.stringify(notificationData.content), notificationData.read]
);

logger.debug('Notification created', {
  notificationId: result.insertId,
  correlationId: transactionId
});
```

### 2. Database Indexing Check
- Verify index usage for notification queries
- Ensure indexes are properly created for user_id and read status

## Phase 6: Real-time Notification Delivery

### 1. WebSocket Connection Logging
```javascript
// Monitor WebSocket connections and message delivery
wss.on('connection', (ws, req) => {
  const userId = getUserIdFromSession(req);
  logger.debug('WebSocket connection established', { userId });
  
  // When sending notification
  logger.debug('Sending notification via WebSocket', {
    userId,
    notificationId,
    timestamp: new Date().toISOString()
  });
});
```

### 2. Socket.io Event Monitoring (if using Socket.io)
```javascript
io.on('connection', (socket) => {
  logger.debug('Socket.io connection', { socketId: socket.id });
  
  // When emitting notification
  socket.emit('notification', notification);
  logger.debug('Socket.io notification emitted', {
    socketId: socket.id,
    notificationId: notification.id,
    eventName: 'notification'
  });
});
```

## Phase 7: End-to-End Testing Tools

### 1. Create Debug API Endpoints
```javascript
// Temporary debug endpoint to trace a notification's journey
router.get('/debug/notification/:id', async (req, res) => {
  const notificationId = req.params.id;
  
  // Gather all logs related to this notification
  const notificationLogs = await queryLogs({ 
    notificationId,
    timeRange: '24h'
  });
  
  res.json({ notificationId, trace: notificationLogs });
});
```

### 2. Setup Centralized Logging
- Configure log aggregation with ELK stack (Elasticsearch, Logstash, Kibana)
- Create custom dashboards for subscription processing flows

### 3. Distributed Tracing Implementation
```javascript
// Add OpenTelemetry or similar tracing
const tracer = opentelemetry.trace.getTracer('subscription-processing');

async function processSubscription(subscriptionId) {
  const span = tracer.startSpan('process_subscription');
  span.setAttribute('subscription.id', subscriptionId);
  
  try {
    // Processing logic here
    
    span.end();
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
    span.end();
    throw error;
  }
}
```

## Phase 8: Monitoring and Alerting

### 1. Failure Rate Monitoring
```javascript
// Track subscription processing success/failure rates
metrics.increment('subscription.processing.attempt', { subscriptionId });
metrics.increment('subscription.processing.success', { subscriptionId });
// or on failure
metrics.increment('subscription.processing.failure', { 
  subscriptionId,
  reason: errorReason
});
```

### 2. Performance Metrics Collection
```javascript
// Track processing times
const startTime = Date.now();
await processSubscription(subscriptionId);
const duration = Date.now() - startTime;
metrics.timing('subscription.processing.duration', duration);
```

### 3. Health Check Implementation
```javascript
// Add health checks for all components in the notification pipeline
app.get('/health/notification-system', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  const queueHealth = await checkMessageQueueConnection();
  const cacheHealth = await checkRedisConnection();
  
  res.json({
    status: dbHealth && queueHealth && cacheHealth ? 'healthy' : 'degraded',
    components: {
      database: dbHealth ? 'connected' : 'disconnected',
      messageQueue: queueHealth ? 'connected' : 'disconnected',
      cache: cacheHealth ? 'connected' : 'disconnected'
    }
  });
});
```

## Execution Strategy

1. **Implement Logging First**: Add comprehensive logging to identify the general flow and potential issues.
2. **Test With Controlled Data**: Process specific subscriptions with known parameters to trace the complete flow.
3. **Analyze Bottlenecks**: Look for delays, errors, or inconsistencies in the process.
4. **Review Transaction Boundaries**: Ensure proper transaction management across systems.
5. **Check Error Handling**: Verify that errors are properly caught, logged, and reported.
6. **Monitor Real-time Components**: Ensure WebSocket/Socket.io connections are working correctly.
7. **Validate Data Integrity**: Verify notification data is correctly passed through all systems. 