/**
 * Check User Existence in Database
 * 
 * This script checks if the current user exists in the backend database.
 */

const { makeApiRequest, loadAuthToken } = require('../../core/api-client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');

async function checkUserExists() {
  logger.info('Starting user existence check');
  
  try {
    const accessToken = await loadAuthToken();
    const userId = process.env.USER_ID || '65c6074d-dbc4-4091-8e45-b6aecffd9ab9';
    
    logger.info(`Checking if user ID ${userId} exists in database`);
    
    // Check user existence
    const url = `https://backend-415554190254.us-central1.run.app/api/diagnostics/user`;
    const response = await makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      }
    });
    
    logger.info(`User check response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200) {
      const userExists = response.data && response.data.user_exists === true;
      
      if (userExists) {
        logger.success(`User exists in database: ${userId}`);
        return true;
      } else {
        logger.warn(`User DOES NOT exist in database: ${userId}`);
        
        // Try to create the user
        logger.info("Attempting to create user via diagnostic endpoint...");
        
        const createUrl = `https://backend-415554190254.us-central1.run.app/api/diagnostics/create-user`;
        const createResponse = await makeApiRequest({
          url: createUrl,
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
        
        logger.info(`User creation response: ${JSON.stringify(createResponse.data, null, 2)}`);
        
        if (createResponse.status === 200 || createResponse.status === 201) {
          logger.success(`User created successfully: ${userId}`);
          return true;
        } else {
          logger.error(`Failed to create user: ${userId}`);
          return false;
        }
      }
    } else {
      logger.error(`User check failed with status code ${response.status}: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error checking user existence: ${error.message}`);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  checkUserExists()
    .then(result => {
      logger.info(`User check completed with result: ${result}`);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
    });
}

module.exports = checkUserExists;