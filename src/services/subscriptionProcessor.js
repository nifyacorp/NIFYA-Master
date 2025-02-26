const createNotification = async (subscription, matches) => {
  // ... existing code ...
  
  // Modify the notification publishing code to skip it if topics aren't available
  if (pubsub.emailImmediateTopic && subscription.notification_preference === 'immediate') {
    // Only try to publish if the topic exists
    await pubsub.emailImmediateTopic.publish(...);
  } else if (pubsub.emailDailyTopic && subscription.notification_preference === 'daily') {
    // Only try to publish if the topic exists
    await pubsub.emailDailyTopic.publish(...);
  } else {
    logger.info('Skipping notification publishing - email topics not configured', {
      subscription_id: subscription.id
    });
  }
  
  // ... existing code ...
} 