/**
 * NIFYA API Client Utilities
 * 
 * This module provides helper functions for making API requests to NIFYA services
 * with proper authentication headers and error handling.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Base directories
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs');
const LOGS_DIR = path.join(OUTPUT_DIR, 'logs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');

// Create directories if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if extraction fails
 */
function getUserIdFromToken(token) {
  try {
    // JWT tokens are in the format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Extract user ID - check common property names
    return payload.sub || payload.user_id || payload.id;
  } catch (error) {
    console.error('Failed to extract user ID from token:', error.message);
    return null;
  }
}

/**
 * Make an API request with proper headers
 * @param {Object} options - HTTPS request options
 * @param {string} [token] - JWT token for authentication
 * @param {Object|string} [body] - Request body data
 * @returns {Promise<Object>} API response
 */
function makeApiRequest(options, token = null, body = null) {
  return new Promise((resolve, reject) => {
    try {
      // Set auth headers if token is provided
      if (token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
        
        // Extract and add user ID header
        const userId = getUserIdFromToken(token);
        if (userId) {
          options.headers['x-user-id'] = userId;
        } else {
          console.warn('⚠️ Warning: Could not extract user ID from token. API might require x-user-id header.');
        }
      }
      
      // Set content type if not specified
      if ((!options.headers || !options.headers['Content-Type'])) {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
      }

      // Sanitize path - this can help prevent 'match' errors with malformed paths
      if (options.path && typeof options.path === 'string') {
        // Remove any double slashes
        options.path = options.path.replace(/\/+/g, '/');
        // Ensure path starts with /
        if (!options.path.startsWith('/')) {
          options.path = '/' + options.path;
        }
        // Fix API prefix if needed
        if (options.path.includes('/api/subscriptions/') && !options.path.includes('/api/v1/')) {
          console.log('⚠️ Updating legacy API path to v1 format');
          options.path = options.path.replace('/api/subscriptions/', '/api/v1/subscriptions/');
        }
      }
      
      console.log(`Making ${options.method} request to ${options.hostname}${options.path}`);
      console.log(`Headers: ${JSON.stringify(options.headers || {})}`);
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
          try {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400) {
              console.log(`Received redirect to: ${res.headers.location}`);
              
              // Return redirect info
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                isRedirect: true,
                location: res.headers.location,
                raw: data
              });
              return;
            }
            
            // Try to parse JSON response
            let parsedData = null;
            try {
              parsedData = JSON.parse(data);
            } catch (e) {
              // If not JSON, just return the raw data
              parsedData = { 
                raw: data.substring(0, 500) + (data.length > 500 ? '...' : ''),
                _parseError: e.message
              };
            }
            
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData,
              raw: data
            });
          } catch (error) {
            console.error('Error processing response:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`Request error: ${error.message}`);
        reject(error);
      });
      
      if (body) {
        const bodyData = typeof body === 'string' ? body : JSON.stringify(body);
        console.log(`Request body: ${bodyData.substring(0, 200)}${bodyData.length > 200 ? '...' : ''}`);
        req.write(bodyData);
      }
      
      req.end();
    } catch (error) {
      console.error('Error preparing request:', error);
      reject(error);
    }
  });
}

/**
 * Load authentication token from file
 * @param {string} [filePath] - Path to token file
 * @returns {string|null} Auth token or null if loading fails
 */
function loadAuthToken(filePath = path.join(OUTPUT_DIR, 'auth_token.txt')) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    console.error(`Failed to load auth token from ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Save API response to file
 * @param {string} prefix - Filename prefix
 * @param {Object} response - API response object
 * @param {string} [dir] - Output directory
 */
function saveResponseToFile(prefix, response, dir = RESPONSES_DIR) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save raw response
    fs.writeFileSync(path.join(dir, `${prefix}_raw.json`), response.raw || '');
    
    // Save formatted response
    if (response.data) {
      fs.writeFileSync(path.join(dir, `${prefix}.json`), JSON.stringify(response.data, null, 2));
    }
    
    console.log(`Response saved to ${dir}/${prefix}.json and ${dir}/${prefix}_raw.json`);
  } catch (error) {
    console.error(`Failed to save response:`, error.message);
  }
}

/**
 * Append test results to the test details file
 * @param {string} testName - Name of the test
 * @param {boolean} success - Whether the test was successful
 * @param {string} details - Test details
 * @param {string} [file] - Test details file
 */
function appendTestDetails(testName, success, details, file = path.join(LOGS_DIR, 'test-details.txt')) {
  try {
    // Ensure directory exists
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const content = `
[${timestamp}] Test: ${testName}
Status: ${success ? 'SUCCESS' : 'FAILURE'}
${details}
--------------------------------------------------
`;
    fs.appendFileSync(file, content);
    console.log(`Test results appended to ${file}`);
  } catch (error) {
    console.error(`Failed to append test details:`, error.message);
  }
}

module.exports = {
  getUserIdFromToken,
  makeApiRequest,
  loadAuthToken,
  saveResponseToFile,
  appendTestDetails
};