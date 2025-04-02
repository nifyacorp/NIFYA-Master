/**
 * This test adds a test user to the database directly
 * It can help diagnose the foreign key constraint issue
 */
const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../../core/api-client');
const { backend } = require('../../config/endpoints');
const logger = require('../../core/logger');

async function addTestUser() {
  logger.info('Starting add test user test');
  
  try {
    const accessToken = await loadAuthToken();
    const userId = process.env.USER_ID || '65c6074d-dbc4-4091-8e45-b6aecffd9ab9';
    
    logger.info(`Testing diagnostic endpoint to add user with ID: ${userId}`);
    
    // First try checking if the user exists
    const url = `https://${backend.baseUrl}${backend.diagnostics}/user-exists?userId=${userId}`;
    const response = await makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      }
    });
    
    await saveResponseToFile(response, '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/responses/user_exists_response.json');
    
    logger.info(`User existence check response: ${JSON.stringify(response.data)}`);
    
    // Now try to add the user to the database
    const addUserUrl = `https://${backend.baseUrl}${backend.diagnostics}/add-test-user`;
    const addUserResponse = await makeApiRequest({
      url: addUserUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      },
      data: {
        userId: userId,
        email: 'ratonxi@gmail.com',
        name: 'Test User',
        emailVerified: true
      }
    });
    
    await saveResponseToFile(addUserResponse, '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/responses/add_user_response.json');
    
    if (addUserResponse.status === 200 || addUserResponse.status === 201) {
      logger.success(`Test user added/verified successfully: ${JSON.stringify(addUserResponse.data, null, 2)}`);
    } else {
      logger.error(`Failed to add test user: ${JSON.stringify(addUserResponse.data, null, 2)}`);
    }
    
    logger.success('Add test user test completed');
    
  } catch (error) {
    logger.error(`Error in add test user test: ${error.message}`);
    if (error.response) {
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    logger.error('Add test user test failed');
  }
}

addTestUser();