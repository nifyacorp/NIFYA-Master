# Email Notification Implementation Plan

## Overview

This plan outlines the steps to implement a daily email notification digest feature for NIFYA users based on the existing email-notification submodule. The feature will allow users to receive a daily summary of all their notifications via email, enhancing the user experience by providing important updates even when users aren't actively using the application.

## Current Components

The email-notification submodule already provides:

1. **Email sending infrastructure** with Gmail OAuth2 authentication
2. **Template rendering** using Handlebars
3. **PubSub integration** for receiving notification events
4. **Daily digest aggregation** logic
5. **Retry mechanisms** for handling transient failures

## Implementation Steps

### Phase 1: Database Schema Updates and User Preferences (Week 1)

1. **Update User Schema**:
   - Add `email_notifications` flag (boolean) to user preferences
   - Add `digest_time` preference (time of day to receive digests)

```sql
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN notification_email VARCHAR(255);
ALTER TABLE users ADD COLUMN digest_time TIME DEFAULT '08:00:00';
```

2. **Update Notifications Schema**:
   - Add `email_sent` flag to track which notifications have been included in emails

```sql
ALTER TABLE notifications ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN email_sent_at TIMESTAMP;
```

3. **Create User Preference UI**:
   - Add email notification toggle to user settings page
   - Add field for notification email (may differ from account email)
   - Add selector for preferred digest time

### Phase 2: Backend Integration (Week 2)

1. **Integrate Email Notification Service**:
   - Deploy the email-notification service as a standalone microservice
   - Configure environment variables and secrets

2. **Set Up PubSub Topics and Subscriptions**:
   - Create `email-notifications-daily` topic
   - Create subscription for the email service to listen to this topic

3. **Modify Notification Service**:
   - Update `notification-service.js` to publish to the email notification topic
   - Add logic to check user preferences before publishing

```javascript
// In notification-service.js
async function createNotification({ userId, type, content, transactionId }) {
  // Existing notification creation code...
  
  // Check if user has email notifications enabled
  const user = await getUserPreferences(userId);
  if (user.email_notifications && user.notification_email) {
    // Publish to email notification topic
    await publishToTopic('email-notifications-daily', {
      userId,
      email: user.notification_email,
      notification: {
        id: notificationId,
        type,
        title: extractNotificationTitle(content, type, userId),
        content,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

4. **Create Scheduled Job**:
   - Set up Cloud Scheduler to trigger daily digest processing
   - Configure the job to run at multiple times to handle different user preferences

### Phase 3: Testing and Monitoring (Week 3)

1. **Integration Testing**:
   - Test end-to-end flow from notification creation to email delivery
   - Verify that notifications are properly grouped by subscription
   - Test with various notification types and content

2. **Performance Testing**:
   - Test with large numbers of notifications
   - Verify handling of concurrent email sending
   - Test with various user time preferences

3. **Set Up Monitoring**:
   - Create dashboards for email delivery success rates
   - Set up alerts for delivery failures
   - Monitor PubSub message processing

### Phase 4: Frontend Implementation (Week 4)

1. **User Preference UI Implementation**:
   - Build UI components for email notification settings
   - Implement API endpoints for saving preferences
   - Add validation for email addresses

2. **Email Preview Feature**:
   - Add option to preview what the daily digest will look like
   - Create API endpoint that generates a sample digest

3. **User Documentation**:
   - Update help documentation to explain email notification features
   - Create FAQ section for email notifications

## Technical Architecture

```
                                    ┌─────────────────┐
                                    │  Cloud Scheduler │
                                    └────────┬────────┘
                                             │
                 ┌───────────────┐  Triggers │  ┌────────────────────┐
                 │ Notification  │           │  │ Email Notification  │
                 │   Service     │           └─▶│      Service        │
                 └───────┬───────┘              └──────────┬─────────┘
                         │                                 │
                         │                                 │
                         ▼                                 ▼
                ┌─────────────────┐             ┌───────────────────┐
                │   PubSub Topic  │◀────────────│  Daily Digest     │
                │                 │             │   Processing      │
                └─────────────────┘             └───────┬───────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │   Gmail OAuth API   │
                                               └─────────────────────┘
```

## Database Modifications

```
User Preferences:
+-------------------+-------------+------+-----+---------+-------+
| Field             | Type        | Null | Key | Default | Extra |
+-------------------+-------------+------+-----+---------+-------+
| id                | varchar(36) | NO   | PRI | NULL    |       |
| email_notifications | boolean   | NO   |     | false   |       |
| notification_email | varchar(255)| YES  |     | NULL    |       |
| digest_time       | time        | NO   |     | 08:00:00|       |
+-------------------+-------------+------+-----+---------+-------+

Notifications:
+-------------------+-------------+------+-----+---------+-------+
| Field             | Type        | Null | Key | Default | Extra |
+-------------------+-------------+------+-----+---------+-------+
| id                | varchar(36) | NO   | PRI | NULL    |       |
| email_sent        | boolean     | NO   |     | false   |       |
| email_sent_at     | timestamp   | YES  |     | NULL    |       |
+-------------------+-------------+------+-----+---------+-------+
```

## Environment Variables

```
# Email Service Configuration
EMAIL_SERVICE_URL=https://email-service-url
PUBSUB_EMAIL_TOPIC=email-notifications-daily

# Gmail OAuth2 Configuration
GMAIL_USER=nifya-notifications@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Service Configuration
MAX_EMAILS_PER_BATCH=50
EMAIL_RETRY_ATTEMPTS=3
```

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Email deliverability issues | High | Medium | Implement robust retry mechanisms; monitor delivery rates |
| High notification volume overwhelms service | High | Low | Implement rate limiting and batching; scale service horizontally |
| User spam complaints | Medium | Medium | Clear unsubscribe options; respect user preferences |
| Data privacy concerns | High | Low | Ensure compliance with data protection regulations; limit sensitive data in emails |
| Email template rendering issues | Medium | Low | Thorough testing with various notification types; fallback templates |

## Success Metrics

- **Delivery Rate**: >99% successful email deliveries
- **Open Rate**: >30% open rate for notification emails
- **User Adoption**: >40% of active users enabling email notifications
- **User Retention**: Increased engagement from users receiving email digests

## Future Enhancements

1. **Notification Preferences by Type**: Allow users to choose which notification types they receive via email
2. **Immediate Critical Notifications**: Option for immediate emails for high-priority notifications
3. **Custom Digest Frequency**: Allow users to choose daily, weekly, or custom frequencies
4. **Rich Email Templates**: Enhanced email templates with branding and interactive elements
5. **Mobile-Responsive Design**: Optimize email templates for mobile viewing

## Conclusion

The implementation of email notification digests will enhance user engagement by providing timely updates without requiring users to actively check the application. The existing email-notification submodule provides a solid foundation, requiring primarily integration work rather than building new functionality from scratch. This feature will be particularly valuable for retaining users who don't log in frequently but still want to stay informed about important updates.