/**
 * Health Check Test
 * 
 * This script tests the health endpoint of the backend service.
 */

const { makeApiRequest } = require('../../core/api-client');
const logger = require('../../core/logger');

/**
 * Test the health endpoint
 */
async function testHealth() {
  logger.info('Starting health check test');
  
  try {
    // Make the health check request
    const response = await makeApiRequest({
      url: 'https://backend-415554190254.us-central1.run.app/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      logger.success(`Health check successful:\n${JSON.stringify(response.data, null, 2)}`);
      
      // Check if database is connected
      const dbConnected = response.data.services && 
                         response.data.services.database === 'connected';
      
      if (dbConnected) {
        logger.success('Database connection verified');
      } else {
        logger.warn('Database connection status is not confirmed');
      }
      
      return true;
    } else {
      logger.error(`Health check failed with status ${response.status}`);
      logger.error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testHealth()
    .then(success => {
      if (success) {
        logger.info('Health check test completed successfully');
      } else {
        logger.error('Health check test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Unexpected error during health check: ${error}`);
      process.exit(1);
    });
}

module.exports = testHealth;