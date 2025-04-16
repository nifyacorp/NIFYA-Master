# Email Notification Service Implementation Plan

## Current Status

The email notification service already has a robust foundation with:
- Email sending capabilities via Gmail/OAuth
- Database connectivity
- Template rendering with Handlebars
- PubSub integration for both immediate and daily notifications
- Express server with health check and test endpoints

## Enhancement Requirements

1. Daily email digests with notifications from the last 24 hours
2. Proper database connectivity for retrieving user notifications
3. Tracking of sent emails to avoid duplicates

## Implementation Plan

### 1. Scheduled Daily Email Processing

#### 1.1 Create a Scheduled Job
- Implement a cron-like scheduler using `node-cron` to trigger daily digest processing at a specific time (e.g., 9 AM)
- Modify `src/index.js` to initialize this scheduler when the service starts

```javascript
// In src/index.js
import cron from 'node-cron';
import { processDailyDigests } from './services/notifications.js';

// Schedule daily digest processing at 9 AM
cron.schedule('0 9 * * *', async () => {
  logger.info('Starting scheduled daily digest processing');
  try {
    await processDailyDigests();
    logger.info('Scheduled daily digest processing completed successfully');
  } catch (error) {
    logger.error('Scheduled daily digest processing failed', {
      error: error.message,
      stack: error.stack
    });
  }
});
```

#### 1.2 Email Sending Strategy Options

We have two main options for sending emails:

##### Option 1: Continue using Gmail API (Current Implementation)

**Pros:**
- Already implemented and working
- No additional cost
- Direct control over sending process
- Current template system with Handlebars is sufficient

**Cons:**
- Gmail has sending limits (2,000 emails/day for regular accounts)
- Potentially lower deliverability rates
- Less analytics and tracking capabilities

##### Option 2: Implement Email Service Provider (e.g., SendGrid, Mailchimp)

**Pros:**
- Higher sending limits
- Better deliverability rates
- Advanced analytics and tracking
- Pre-built templates and template editors

**Cons:**
- Additional cost based on volume
- Integration effort required
- New dependency to manage

**Recommendation:** 
For the current scale, continue with the Gmail API approach as it's already implemented and working. The existing Handlebars template system provides sufficient flexibility. As the service scales beyond 1,000 users, consider migrating to a dedicated email service provider.

Implementation for continuing with Gmail:
```javascript
// No changes needed to the sending mechanism
// Continue using the existing email.js service
```

#### 1.3 Scheduling Strategy Options

We have two main options for scheduling the daily digest process:

##### Option 1: In-Service Scheduling (node-cron)

**Pros:**
- Simple implementation
- No additional services to deploy and maintain
- Contained within the email service

**Cons:**
- If the service restarts, the scheduler also restarts
- Less reliable for critical scheduling
- Not distributed (runs on a single instance)

##### Option 2: Dedicated Scheduling Service (Cloud Scheduler + PubSub)

**Pros:**
- More reliable and durable
- Decoupled from the email service
- Better for production environments
- Centralized scheduling management

**Cons:**
- Requires additional configuration
- Slightly more complex architecture

**Recommendation:**
For production, implement Option 2 with Cloud Scheduler triggering a PubSub topic that the email service subscribes to. This provides better reliability and separation of concerns.

Implementation for Cloud Scheduler approach:
```javascript
// In src/services/pubsub.js, add a new subscription handler

export async function startScheduledDigestSubscriber() {
  const subscription = pubsub.subscription('scheduled-daily-digest-sub');

  subscription.on('message', async (message) => {
    try {
      logger.info('Received scheduled digest trigger', { messageId: message.id });
      
      await processDailyDigests();
      
      message.ack();
      logger.info('Successfully processed scheduled digest', { messageId: message.id });
    } catch (error) {
      logger.error('Failed to process scheduled digest', { 
        messageId: message.id, 
        error: error.message 
      });
      message.nack();
    }
  });

  subscription.on('error', (error) => {
    logger.error('Scheduled digest subscription error', { error: error.message });
  });

  logger.info('Started scheduled digest subscriber');
}

// In src/index.js
await startScheduledDigestSubscriber();
```

Cloud Scheduler configuration:
```
Name: daily-digest-trigger
Frequency: 0 9 * * * (9 AM daily)
Target type: Pub/Sub
Topic: projects/PROJECT_ID/topics/scheduled-daily-digest
Message: {"action":"process_daily_digest"}
```

### 2. Database Query Optimization

#### 2.1 Improve Notification Retrieval
- Enhance the `getUsersWithNewNotifications` and `getUserNotifications` functions to efficiently retrieve notifications from the last 24 hours
- Add parameters for controlling the time window

```javascript
// Add time window parameter for more flexible queries
export async function getUserNotifications(userId, options = {}) {
  const { hoursBack = 24, markAsRead = true } = options;
  
  try {
    const query = `
      SELECT
        n.id,
        n.title,
        n.content,
        n.source_url,
        n.metadata,
        n.created_at,
        s.name as subscription_name,
        s.type_id
      FROM notifications n
      JOIN subscriptions s ON s.id = n.subscription_id
      WHERE
        n.user_id = $1
        AND n.created_at > NOW() - INTERVAL '${hoursBack} hours'
        AND NOT n.email_sent
      ORDER BY n.created_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    logger.info(`Found ${result.rows.length} notifications for user ${userId} in last ${hoursBack} hours`);
    return result.rows;
  } catch (error) {
    logger.error('Error getting user notifications', {
      error: error.message,
      userId,
      stack: error.stack
    });
    throw error;
  }
}
```

#### 2.2 Track Email Sending Status
- Enhance the `markNotificationsAsSent` function to include a timestamp
- Ensure notifications are only sent once by checking the `email_sent` flag

### 3. Email Content and Template Enhancement

#### 3.1 Improve the Daily Email Template
- Update the daily digest template to better group notifications by subscription
- Add more contextual information about notification sources
- Enhance readability and user experience

#### 3.2 Add User Preferences Management
- Allow users to configure their notification preferences
- Respect user time zone preferences for sending daily digests
- Implement frequency settings (daily/weekly/immediate)

### 4. Error Handling and Retry Mechanism

#### 4.1 Enhance Resilience
- Implement proper retry mechanisms for failed database queries
- Add circuit breaker pattern for external services
- Improve error logging with detailed context

#### 4.2 Transaction Support
- Implement database transactions to ensure consistency
- Add atomic operations for marking notifications as sent

### 5. Monitoring and Operations

#### 5.1 Add Metrics Collection
- Track successful and failed email sends
- Monitor database performance
- Set up alerts for service degradation

#### 5.2 Dashboard and Reporting
- Create admin dashboard for monitoring email service status
- Generate reports on email delivery rates and user engagement

## Implementation Priority

1. **High Priority**: Daily email scheduling, database query optimization
2. **Medium Priority**: Error handling improvements, email template enhancements
3. **Low Priority**: Metrics collection, admin dashboard

## Dependencies

- Node.js runtime environment
- PostgreSQL database
- Google Cloud PubSub
- Gmail API for sending emails (or email service provider if chosen)
- Secret Manager for credentials
- Cloud Scheduler (if using dedicated scheduling)

## Timeline

- Week 1: Implement scheduled job processing and database query optimization
- Week 2: Enhance error handling and email templates
- Week 3: Add monitoring and metrics collection

## Success Criteria

- Daily emails are sent reliably to all users with notifications
- No duplicate notifications are sent
- System gracefully handles errors and retries when needed
- Performance is maintained with growing user base

## Limitations and Considerations

### Gmail API Limitations
- Sending limit of 2,000 emails per day for standard Gmail accounts
- Email size limited to 25MB
- Rate limits for API requests
- Potential deliverability issues compared to dedicated email services

### Scheduling Limitations
- In-service scheduling (node-cron) is less reliable for production use
- Service restarts will reset the scheduler
- Single-instance scheduling doesn't scale horizontally

### Scalability Considerations
- Current implementation suitable for up to ~1,000 users
- For higher scale, consider:
  - Migrating to a dedicated email service provider
  - Implementing a distributed task queue (e.g., Cloud Tasks)
  - Sharding users across multiple sending instances
  - Implementing more sophisticated rate limiting

### Monitoring Needs
- Track email bounces and delivery failures
- Monitor template rendering performance
- Track database query performance
- Alert on abnormal sending patterns

### Disaster Recovery
- Implement retry mechanism for failed sends
- Store email send status in database for recovery
- Consider implementing a dead-letter queue for failed notifications
- Regular backups of email templates and configuration