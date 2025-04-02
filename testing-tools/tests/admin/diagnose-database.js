/**
 * This test diagnoses database issues
 * It calls diagnostics endpoints to check database connectivity and tables
 */
const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../../core/api-client');
const { backend } = require('../../config/endpoints');
const logger = require('../../core/logger');

async function diagnoseDatabaseIssues() {
  logger.info('Starting database diagnostic test');
  
  try {
    const accessToken = await loadAuthToken();
    const userId = process.env.USER_ID || '65c6074d-dbc4-4091-8e45-b6aecffd9ab9';
    
    // Test diagnostics endpoints
    const endpoints = [
      '/health',
      '/api/diagnostics',
      '/api/diagnostics/db-status',
      '/api/diagnostics/db-tables'
    ];
    
    for (const endpoint of endpoints) {
      logger.info(`Testing endpoint: ${endpoint}`);
      
      const url = `https://${backend.baseUrl}${endpoint}`;
      const response = await makeApiRequest({
        url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-user-id': userId
        }
      });
      
      const filename = endpoint.replace(/\//g, '-').replace(/^-/, '');
      await saveResponseToFile(response, `/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/responses/${filename}.json`);
      
      if (response.status >= 200 && response.status < 300) {
        logger.success(`Endpoint ${endpoint} returned success: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        logger.error(`Endpoint ${endpoint} failed with status ${response.status}: ${JSON.stringify(response.data, null, 2)}`);
      }
    }
    
    logger.success('Database diagnostic test completed');
    
  } catch (error) {
    logger.error(`Error in database diagnostic test: ${error.message}`);
    if (error.response) {
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    logger.error('Database diagnostic test failed');
  }
}

diagnoseDatabaseIssues();