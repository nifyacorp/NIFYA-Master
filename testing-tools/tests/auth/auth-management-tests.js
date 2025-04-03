/**
 * Authentication Management Test Suite
 * 
 * This script provides comprehensive tests for authentication endpoints including:
 * - Login
 * - Session management
 * - Password operations
 * - User profile access
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const testAuth = require('./login');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs', 'responses');
const REPORTS_DIR = path.join(__dirname, '..', '..', 'outputs', 'reports');
const AUTH_TOKEN_FILE = path.join(__dirname, '..', '..', 'outputs', 'auth_token.txt');
const REFRESH_TOKEN_FILE = path.join(__dirname, '..', '..', 'outputs', 'refresh_token.txt');
const USER_ID_FILE = path.join(__dirname, '..', '..', 'outputs', 'user_id.txt');

// Ensure output directories exist
[OUTPUT_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Extract schema from response object
 */
function extractSchema(obj) {
  if (!obj) return null;
  
  const schema = {};
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'empty array';
    // Get schema of first item as representative
    return { arrayOf: extractSchema(obj[0]) };
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null) {
        schema[key] = 'null';
      } else if (Array.isArray(obj[key])) {
        if (obj[key].length === 0) {
          schema[key] = 'empty array';
        } else {
          schema[key] = { arrayOf: extractSchema(obj[key][0]) };
        }
      } else if (typeof obj[key] === 'object') {
        schema[key] = extractSchema(obj[key]);
      } else {
        schema[key] = typeof obj[key];
      }
    });
    return schema;
  } else {
    return typeof obj;
  }
}

/**
 * Run all authentication management tests
 */
async function runAuthManagementTests() {
  const startTime = Date.now();
  logger.info('Starting Authentication Management Tests');
  
  // Initialize results object
  const results = {
    overall: {
      success: false,
      successRate: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0
    },
    tests: [],
    schemas: {},
    recommendations: []
  };
  
  // Define tests to run
  const testsToRun = [
    { name: 'login', runner: testLogin },
    { name: 'getProfile', runner: testGetProfile },
    { name: 'getSession', runner: testSession },
    { name: 'refreshToken', runner: testRefreshToken },
    { name: 'revokeAllSessions', runner: testRevokeAllSessions }
  ];
  
  // Run each test and collect results
  for (const test of testsToRun) {
    logger.info(`Running ${test.name} test`, null, 'auth-management');
    
    try {
      const testResult = await test.runner();
      results.tests.push({
        name: test.name,
        success: testResult.success,
        duration: testResult.duration || 0,
        error: testResult.error
      });
      
      if (testResult.success) {
        results.overall.passedTests++;
      } else {
        results.overall.failedTests++;
        
        // Add specific recommendations based on failure
        if (test.name === 'login' && testResult.error) {
          results.recommendations.push(
            'Authentication is failing. Verify credentials and that auth service is running.'
          );
        } else if (test.name === 'refreshToken' && testResult.error) {
          results.recommendations.push(
            'Token refresh is not working. Verify that refresh tokens are being issued properly.'
          );
        }
      }
      
      // Save schema information if available
      if (testResult.schema) {
        results.schemas[test.name] = testResult.schema;
      }
    } catch (error) {
      logger.error(`Error running ${test.name} test`, error, 'auth-management');
      results.tests.push({
        name: test.name,
        success: false,
        error: error.message
      });
      results.overall.failedTests++;
    }
  }
  
  // Calculate overall results
  results.overall.totalTests = testsToRun.length;
  results.overall.successRate = (results.overall.passedTests / results.overall.totalTests) * 100;
  results.overall.success = results.overall.successRate >= 70; // Consider 70% as passing
  results.overall.duration = Date.now() - startTime;
  
  // Add general recommendations if success rate is low
  if (results.overall.successRate < 70) {
    results.recommendations.push(
      'Authentication service tests are failing at an unacceptable rate. Review auth service logs and database connection.'
    );
  }
  
  // Save test results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(REPORTS_DIR, `auth-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Generate readable report
  generateReport(results, timestamp);
  
  return results;
}

/**
 * Generate a markdown report from test results
 */
function generateReport(results, timestamp) {
  const reportFile = path.join(REPORTS_DIR, `auth-${timestamp}.md`);
  
  let report = `# Authentication Management API Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Overall status
  const healthStatus = determineSystemHealth(results);
  report += `## System Health\n\n${healthStatus}\n\n`;
  
  // Test summary
  report += `## Test Summary\n\n`;
  report += `- **Total Tests:** ${results.overall.totalTests}\n`;
  report += `- **Passed Tests:** ${results.overall.passedTests}\n`;
  report += `- **Failed Tests:** ${results.overall.failedTests}\n`;
  report += `- **Success Rate:** ${results.overall.successRate.toFixed(2)}%\n`;
  report += `- **Duration:** ${results.overall.duration}ms\n\n`;
  
  // Individual test results
  report += `## Test Results\n\n`;
  report += `| Test | Status | Error |\n`;
  report += `|------|--------|-------|\n`;
  
  results.tests.forEach(test => {
    const status = test.success ? '✅ Pass' : '❌ Fail';
    const error = test.error || '-';
    report += `| ${test.name} | ${status} | ${error} |\n`;
  });
  
  // Recommendations
  if (results.recommendations.length > 0) {
    report += `\n## Recommendations\n\n`;
    results.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }
  
  // Schemas if available
  if (Object.keys(results.schemas).length > 0) {
    report += `\n## API Response Schemas\n\n`;
    Object.keys(results.schemas).forEach(schemaName => {
      report += `### ${schemaName} Schema\n\n`;
      report += '```json\n';
      report += JSON.stringify(results.schemas[schemaName], null, 2);
      report += '\n```\n\n';
    });
  }
  
  fs.writeFileSync(reportFile, report);
  logger.info(`Report saved to ${reportFile}`, null, 'auth-management');
  
  return report;
}

/**
 * Determine system health based on test results
 */
function determineSystemHealth(results) {
  const successRate = results.overall.successRate;
  
  if (successRate >= 90) {
    return `### ✅ EXCELLENT (${successRate.toFixed(2)}%)
The authentication system is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ⚠️ GOOD (${successRate.toFixed(2)}%)
The authentication system is working but has some minor issues that should be addressed soon.`;
  } else if (successRate >= 50) {
    return `### ⚠️ PARTIAL (${successRate.toFixed(2)}%)
The authentication system is partially working but has significant issues that need immediate attention.`;
  } else {
    return `### ❌ FAILING (${successRate.toFixed(2)}%)
The authentication system is critically compromised with most tests failing. Immediate attention is required.`;
  }
}

/**
 * Test login functionality
 */
async function testLogin() {
  const testName = 'login';
  const startTime = Date.now();
  logger.info('Testing login functionality', null, testName);
  
  try {
    // Use the existing login function
    const authResult = await testAuth();
    
    const endTime = Date.now();
    if (authResult.success) {
      logger.success('Login test passed', null, testName);
      
      // Extract profile schema if available
      let schema = null;
      try {
        const tokenParts = authResult.token.split('.');
        if (tokenParts.length === 3) {
          const tokenPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          schema = extractSchema(tokenPayload);
        }
      } catch (error) {
        logger.warn('Could not extract token payload schema', error, testName);
      }
      
      return {
        success: true,
        duration: endTime - startTime,
        schema,
        token: authResult.token
      };
    } else {
      logger.error('Login test failed', authResult.error, testName);
      return {
        success: false,
        duration: endTime - startTime,
        error: authResult.error
      };
    }
  } catch (error) {
    logger.error('Login test error', error, testName);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test user profile retrieval
 */
async function testGetProfile() {
  const testName = 'getProfile';
  const startTime = Date.now();
  logger.info('Testing user profile retrieval', null, testName);
  
  // Check if we have a token
  if (!fs.existsSync(AUTH_TOKEN_FILE)) {
    logger.error('Authentication token not found. Run login test first.', null, testName);
    return {
      success: false,
      error: 'Authentication token not found'
    };
  }
  
  // Get auth token and user ID
  const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf8');
  let userId = '';
  if (fs.existsSync(USER_ID_FILE)) {
    userId = fs.readFileSync(USER_ID_FILE, 'utf8');
  }
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest({
      url: `https://${endpoints.auth.baseUrl}${endpoints.auth.profile}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    // Save response to file
    apiClient.saveResponseToFile(`${testName}_response`, response, OUTPUT_DIR);
    
    const endTime = Date.now();
    const statusCode = response.statusCode || response.status;
    
    if (statusCode === 200) {
      logger.success('Profile test passed', null, testName);
      
      // Extract schema
      const profileData = response.data.data || response.data;
      const schema = extractSchema(profileData);
      
      return {
        success: true,
        duration: endTime - startTime,
        schema
      };
    } else {
      logger.error(`Profile test failed with status ${statusCode}`, response.data, testName);
      return {
        success: false,
        duration: endTime - startTime,
        error: `HTTP status ${statusCode}`
      };
    }
  } catch (error) {
    logger.error('Profile test error', error, testName);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test session validation
 */
async function testSession() {
  const testName = 'session';
  const startTime = Date.now();
  logger.info('Testing session validation', null, testName);
  
  // Check if we have a token
  if (!fs.existsSync(AUTH_TOKEN_FILE)) {
    logger.error('Authentication token not found. Run login test first.', null, testName);
    return {
      success: false,
      error: 'Authentication token not found'
    };
  }
  
  // Get auth token and user ID
  const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf8');
  let userId = '';
  if (fs.existsSync(USER_ID_FILE)) {
    userId = fs.readFileSync(USER_ID_FILE, 'utf8');
  }
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest({
      url: `https://${endpoints.auth.baseUrl}${endpoints.auth.sessions}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    // Save response to file
    apiClient.saveResponseToFile(`${testName}_response`, response, OUTPUT_DIR);
    
    const endTime = Date.now();
    const statusCode = response.statusCode || response.status;
    
    if (statusCode === 200) {
      logger.success('Session test passed', null, testName);
      
      // Extract schema
      const sessionData = response.data.data || response.data;
      const schema = extractSchema(sessionData);
      
      return {
        success: true,
        duration: endTime - startTime,
        schema
      };
    } else {
      logger.error(`Session test failed with status ${statusCode}`, response.data, testName);
      return {
        success: false,
        duration: endTime - startTime,
        error: `HTTP status ${statusCode}`
      };
    }
  } catch (error) {
    logger.error('Session test error', error, testName);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test token refresh
 */
async function testRefreshToken() {
  const testName = 'refreshToken';
  const startTime = Date.now();
  logger.info('Testing token refresh', null, testName);
  
  // Check if we have a refresh token
  if (!fs.existsSync(REFRESH_TOKEN_FILE)) {
    logger.error('Refresh token not found. Run login test first.', null, testName);
    return {
      success: false,
      error: 'Refresh token not found'
    };
  }
  
  // Get refresh token
  const refreshToken = fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8');
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest({
      url: `https://${endpoints.auth.baseUrl}/api/auth/refresh`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        refreshToken
      }
    });
    
    // Save response to file
    apiClient.saveResponseToFile(`${testName}_response`, response, OUTPUT_DIR);
    
    const endTime = Date.now();
    const statusCode = response.statusCode || response.status;
    
    if (statusCode === 200) {
      // Save new tokens if available
      const newAccessToken = response.data.accessToken || response.data.data?.accessToken || response.data.token;
      const newRefreshToken = response.data.refreshToken || response.data.data?.refreshToken;
      
      if (newAccessToken) {
        fs.writeFileSync(AUTH_TOKEN_FILE, newAccessToken);
        logger.info('New access token saved', null, testName);
      }
      
      if (newRefreshToken) {
        fs.writeFileSync(REFRESH_TOKEN_FILE, newRefreshToken);
        logger.info('New refresh token saved', null, testName);
      }
      
      logger.success('Token refresh test passed', null, testName);
      return {
        success: true,
        duration: endTime - startTime
      };
    } else {
      logger.error(`Token refresh test failed with status ${statusCode}`, response.data, testName);
      return {
        success: false,
        duration: endTime - startTime,
        error: `HTTP status ${statusCode}`
      };
    }
  } catch (error) {
    logger.error('Token refresh test error', error, testName);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test revoke all sessions
 */
async function testRevokeAllSessions() {
  const testName = 'revokeAllSessions';
  const startTime = Date.now();
  logger.info('Testing revoke all sessions', null, testName);
  
  // Check if we have a token
  if (!fs.existsSync(AUTH_TOKEN_FILE)) {
    logger.error('Authentication token not found. Run login test first.', null, testName);
    return {
      success: false,
      error: 'Authentication token not found'
    };
  }
  
  // Get auth token and user ID
  const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf8');
  let userId = '';
  if (fs.existsSync(USER_ID_FILE)) {
    userId = fs.readFileSync(USER_ID_FILE, 'utf8');
  }
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest({
      url: `https://${endpoints.auth.baseUrl}${endpoints.auth.revokeSessions}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    // Save response to file
    apiClient.saveResponseToFile(`${testName}_response`, response, OUTPUT_DIR);
    
    const endTime = Date.now();
    const statusCode = response.statusCode || response.status;
    
    if (statusCode === 200 || statusCode === 204) {
      logger.success('Revoke all sessions test passed', null, testName);
      return {
        success: true,
        duration: endTime - startTime
      };
    } else {
      logger.error(`Revoke all sessions test failed with status ${statusCode}`, response.data, testName);
      return {
        success: false,
        duration: endTime - startTime,
        error: `HTTP status ${statusCode}`
      };
    }
  } catch (error) {
    logger.error('Revoke all sessions test error', error, testName);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests if this script is called directly
if (require.main === module) {
  runAuthManagementTests()
    .then(results => {
      logger.info(`Authentication Management Tests completed with ${results.overall.successRate.toFixed(2)}% success rate`);
      logger.info(`Passed: ${results.overall.passedTests}/${results.overall.totalTests} tests`);
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Error running Authentication Management Tests', error);
      process.exit(1);
    });
}

module.exports = runAuthManagementTests;