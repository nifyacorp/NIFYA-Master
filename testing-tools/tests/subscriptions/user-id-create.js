const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../../core/api-client');
const { backend } = require('../../config/endpoints');
const fs = require('fs/promises');
const logger = require('../../core/logger');

async function testUserIdSubscriptionCreation() {
  logger.info('Starting subscription creation with explicit user_id test');
  
  try {
    const accessToken = await loadAuthToken();
    const userId = process.env.USER_ID || '65c6074d-dbc4-4091-8e45-b6aecffd9ab9';
    
    const subscriptionData = {
      name: "Test BOE Subscription",
      type: "boe",
      prompts: ["Ayuntamiento Barcelona licitaciones"],
      frequency: "daily",
      configuration: "{}",
      user_id: userId // Explicitly setting user_id
    };
    
    logger.info(`Creating subscription with user_id: ${backend.baseUrl}${backend.subscriptions.create}\n${JSON.stringify(subscriptionData, null, 2)}`);
    
    const response = await makeApiRequest({
      url: `https://${backend.baseUrl}${backend.subscriptions.create}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      },
      data: subscriptionData
    });
    
    await saveResponseToFile(response, '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/responses/user_id_subscription_response.json');
    
    if (response.status === 200 || response.status === 201) {
      logger.success(`Subscription created successfully with ID: ${response.data.id}`);
      // Save subscription ID for future tests
      await fs.writeFile('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/latest_subscription_id.txt', response.data.id);
      logger.success(`Test user-id-create-subscription: PASSED\n${JSON.stringify(response.data, null, 2)}`);
    } else {
      logger.error(`Subscription creation failed with status code ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
      logger.error(`Test user-id-create-subscription: FAILED\nStatus code ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    logger.success('Subscription creation with user_id test completed');
    
  } catch (error) {
    logger.error(`Error in subscription creation test: ${error.message}`);
    if (error.response) {
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    logger.error('Subscription creation with user_id test failed');
  }
}

testUserIdSubscriptionCreation();