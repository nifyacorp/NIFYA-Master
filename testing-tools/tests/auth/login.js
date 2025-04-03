/**
 * Authentication Login Test
 * 
 * This script tests the authentication service login endpoint and
 * saves the authentication token for use in other tests.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const AUTH_TOKEN_FILE = path.join(OUTPUT_DIR, 'auth_token.txt');
const REFRESH_TOKEN_FILE = path.join(OUTPUT_DIR, 'refresh_token.txt');
const USER_ID_FILE = path.join(OUTPUT_DIR, 'user_id.txt');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Test authentication with credentials
 */
async function testAuthentication() {
  const testName = 'auth-login';
  logger.info('Starting authentication test', null, testName);
  
  // Authentication data
  const authData = {
    email: endpoints.testData.login.email,
    password: endpoints.testData.login.password
  };
  
  // Request options
  const options = {
    hostname: endpoints.auth.baseUrl,
    port: 443,
    path: endpoints.auth.login,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  logger.info(`Sending authentication request to: ${options.hostname}${options.path}`, null, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest({
      url: `https://${options.hostname}${options.path}`,
      method: options.method,
      headers: options.headers,
      data: authData
    });
    
    // Save response to file
    apiClient.saveResponseToFile('auth_response', response, OUTPUT_DIR);
    
    // Make sure we have a proper status code
    const statusCode = response.statusCode || response.status;
    
    if (statusCode === 200 || statusCode === 201) {
      const accessToken = response.data.accessToken || response.data.data?.token || response.data.token;
      const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
      
      if (accessToken) {
        // Save token to file
        fs.writeFileSync(AUTH_TOKEN_FILE, accessToken);
        logger.success('Authentication successful! Access token saved', { tokenPreview: accessToken.substring(0, 10) + '...' }, testName);
        
        // Save refresh token if available
        if (refreshToken) {
          fs.writeFileSync(REFRESH_TOKEN_FILE, refreshToken);
          logger.info('Refresh token saved', { tokenPreview: refreshToken.substring(0, 10) + '...' }, testName);
        } else {
          logger.warn('No refresh token found in response', null, testName);
        }
        
        // Extract and save user ID if available
        const userId = response.data.user?.id || apiClient.getUserIdFromToken(accessToken);
        if (userId) {
          fs.writeFileSync(USER_ID_FILE, userId);
          logger.info(`User ID saved: ${userId}`, null, testName);
        } else {
          logger.warn('Could not extract user ID from response or token', null, testName);
        }
        
        // Log test result
        logger.testResult(testName, true, {
          accessToken: accessToken.substring(0, 10) + '...',
          refreshToken: refreshToken ? (refreshToken.substring(0, 10) + '...') : 'Not available',
          userId: userId || 'Not extracted',
          statusCode: statusCode
        });
        
        return { success: true, token: accessToken, refreshToken, userId };
      } else {
        // No token in response
        logger.error('Authentication failed: No access token in response', response.data, testName);
        logger.testResult(testName, false, 'No access token in response');
        return { success: false, error: 'No access token in response' };
      }
    } else {
      // Non-success status code
      logger.error(`Authentication failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Authentication request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testAuthentication()
    .then(result => {
      if (result.success) {
        logger.success('Authentication test completed successfully');
      } else {
        logger.error('Authentication test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in authentication test', error);
      process.exit(1);
    });
}

module.exports = testAuthentication;