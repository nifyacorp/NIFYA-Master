const initializePubSub = async () => {
  const logger = getLogger('pubsub');
  
  try {
    logger.info('Initializing PubSub configuration');
    
    // Comment out or remove this code that tries to access the missing secrets
    /*
    const emailImmediateTopicName = await getSecret('EMAIL_IMMEDIATE_TOPIC_NAME');
    const emailDailyTopicName = await getSecret('EMAIL_DAILY_TOPIC_NAME');
    
    const emailImmediateTopic = pubSubClient.topic(emailImmediateTopicName);
    const emailDailyTopic = pubSubClient.topic(emailDailyTopicName);
    */
    
    // Instead, just initialize the PubSub client without the email topics
    const pubSubClient = new PubSub({
      projectId: process.env.PROJECT_ID,
    });
    
    logger.info('PubSub client initialized', {
      mode: process.env.NODE_ENV || 'development'
    });
    
    return {
      pubSubClient,
      // Return null or placeholder values for now
      emailImmediateTopic: null,
      emailDailyTopic: null
    };
  } catch (error) {
    // ... existing error handling ...
  }
}; 