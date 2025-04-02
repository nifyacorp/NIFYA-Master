/**
 * Simple test login script
 */

const { makeApiRequest } = require('../../core/api-client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');

async function testLogin() {
  const authUrl = 'https://authentication-service-415554190254.us-central1.run.app/api/auth/login';
  const outputDir = path.join(__dirname, '..', '..', 'outputs');
  
  logger.info('Starting test login...');
  
  try {
    // Make sure the outputs directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Make the login request
    const authResponse = await makeApiRequest({
      url: authUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: 'ratonxi@gmail.com',
        password: 'nifyaCorp12!'
      }
    });
    
    if (authResponse.status === 200 || authResponse.status === 201) {
      const accessToken = authResponse.data.accessToken || authResponse.data.access_token || authResponse.data.token;
      
      if (accessToken) {
        // Save the token to file
        await fs.writeFile(path.join(outputDir, 'auth_token.txt'), accessToken);
        logger.success(`Authentication successful! Token saved (first 10 chars): ${accessToken.substring(0, 10)}...`);
        return true;
      } else {
        logger.error('No access token found in response:', authResponse.data);
        return false;
      }
    } else {
      logger.error(`Authentication failed with status ${authResponse.status}:`, authResponse.data);
      return false;
    }
  } catch (error) {
    logger.error('Login error:', error.message);
    return false;
  }
}

// Run the login
testLogin().then(success => {
  if (success) {
    logger.info('Test login completed successfully');
  } else {
    logger.error('Test login failed');
    process.exit(1);
  }
});