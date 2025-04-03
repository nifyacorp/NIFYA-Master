/**
 * NIFYA API Client Utilities
 * 
 * This module provides helper functions for making API requests to NIFYA services
 * with proper authentication headers and error handling.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const endpoints = require('../config/endpoints');

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
 * @param {Object} options - Request options including url
 * @param {string|null} token - Optional auth token to include
 * @param {Object|null} data - Optional data to include in body
 * @param {boolean} [attemptTokenRefresh=true] - Whether to attempt token refresh if needed
 * @returns {Promise<Object>} API response
 */
/**
 * Make an authenticated API request with automatic token refresh
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
async function makeAuthenticatedRequest(options) {
  // First try to refresh the token if needed
  const token = await refreshTokenIfNeeded();
  if (!token) {
    console.error('Could not get a valid token for authenticated request');
    return { statusCode: 401, data: { error: 'Authentication required' } };
  }
  
  // Make the request with the refreshed token
  return makeApiRequest(options, token, null, false);
}

function makeApiRequest(options, token = null, data = null, attemptTokenRefresh = true) {
  return new Promise(async (resolve, reject) => {
    try {
      // Parse URL if provided directly
      let requestOptions = {};
      let url;
      
      if (options.url) {
        const urlObj = new URL(options.url);
        
        requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: options.headers || {}
        };
        
        url = options.url;
      } else {
        requestOptions = { ...options };
        url = `${requestOptions.protocol || 'https://'}${requestOptions.hostname}${requestOptions.path}`;
      }
      
      // Set content type if not specified
      if (!requestOptions.headers || !requestOptions.headers['Content-Type']) {
        requestOptions.headers = requestOptions.headers || {};
        requestOptions.headers['Content-Type'] = 'application/json';
      }
      
      // If token not provided but attemptTokenRefresh is true, try to load or refresh it
      if (!token && attemptTokenRefresh && 
          !(url.includes('login') || url.includes('auth/refresh'))) {
        token = await refreshTokenIfNeeded();
      }
      
      // Add auth token if available and not already present
      if (token && (!requestOptions.headers.Authorization && !requestOptions.headers.authorization)) {
        requestOptions.headers.Authorization = `Bearer ${token}`;
        
        // Add user ID header if not already present
        // Extract user ID from token
        const userId = getUserIdFromToken(token);
        if (userId && !requestOptions.headers['x-user-id'] && !requestOptions.headers['X-User-ID']) {
          requestOptions.headers['x-user-id'] = userId;
        }
      }

      // Sanitize path - this can help prevent 'match' errors with malformed paths
      if (requestOptions.path && typeof requestOptions.path === 'string') {
        // Remove any double slashes
        requestOptions.path = requestOptions.path.replace(/\/+/g, '/');
        // Ensure path starts with /
        if (!requestOptions.path.startsWith('/')) {
          requestOptions.path = '/' + requestOptions.path;
        }
      }
      
      console.log(`Making ${requestOptions.method} request to ${url}`);
      console.log(`Headers: ${JSON.stringify(requestOptions.headers || {})}`);
      
      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
          try {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400) {
              console.log(`Received redirect to: ${res.headers.location}`);
              
              // Return redirect info
              resolve({
                status: res.statusCode,
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
              statusCode: res.statusCode, // Add explicit statusCode property
              status: res.statusCode,     // Keep existing property for backward compatibility
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
      
      // Handle body data from either options.data or the data parameter
      const bodyData = data || options.data;
      
      if (bodyData) {
        const serializedBody = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
        console.log(`Request body: ${serializedBody}`);
        req.write(serializedBody);
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
 * Load refresh token from file
 * @param {string} [filePath] - Path to refresh token file
 * @returns {string|null} Refresh token or null if loading fails
 */
function loadRefreshToken(filePath = path.join(OUTPUT_DIR, 'refresh_token.txt')) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    console.error(`Failed to load refresh token from ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Check if token is expired or about to expire
 * @param {string} token - JWT token to check
 * @param {number} [bufferSeconds] - Buffer time in seconds (default: 300s = 5min)
 * @returns {boolean} True if token is expired or about to expire
 */
function isTokenExpired(token, bufferSeconds = 300) {
  try {
    // JWT tokens are in the format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    const exp = payload.exp; // Expiration time in seconds
    if (!exp) {
      console.warn('No expiration time found in token payload');
      return false;
    }
    
    // Calculate time until expiration in seconds
    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - currentTimeSeconds;
    
    // Consider the token expired if it's already expired or about to expire within the buffer time
    return timeUntilExpiry <= bufferSeconds;
  } catch (error) {
    console.error('Error checking token expiration:', error.message);
    return true; // If we can't check, assume it's expired to be safe
  }
}

/**
 * Refresh the authentication token if it's expired or about to expire
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
async function refreshTokenIfNeeded() {
  const token = loadAuthToken();
  if (!token) {
    console.error('No authentication token found');
    return null;
  }
  
  // Check if token is expired or about to expire
  if (!isTokenExpired(token)) {
    return token; // Token is still valid
  }
  
  console.log('Token is expired or about to expire, attempting to refresh...');
  
  // Load refresh token
  const refreshToken = loadRefreshToken();
  if (!refreshToken) {
    console.error('No refresh token found');
    return null;
  }
  
  try {
    // Make refresh request
    const response = await makeApiRequest({
      url: `https://${endpoints.auth.baseUrl}/api/auth/refresh`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { refreshToken }
    });
    
    // Check response
    if (response.statusCode === 200 && response.data && response.data.accessToken) {
      // Save new tokens
      fs.writeFileSync(path.join(OUTPUT_DIR, 'auth_token.txt'), response.data.accessToken);
      if (response.data.refreshToken) {
        fs.writeFileSync(path.join(OUTPUT_DIR, 'refresh_token.txt'), response.data.refreshToken);
      }
      
      console.log('Token refreshed successfully');
      return response.data.accessToken;
    } else {
      console.error('Failed to refresh token:', response.statusCode, response.data);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Save API response to file
 * @param {string|Object} prefixOrResponse - Filename prefix or response object
 * @param {Object|string} responseOrFilepath - API response object or filepath
 * @param {string} [dir] - Output directory (optional, used with prefix mode)
 */
function saveResponseToFile(prefixOrResponse, responseOrFilepath, dir = RESPONSES_DIR) {
  try {
    // Detect which calling convention is being used
    if (typeof prefixOrResponse === 'string' && typeof responseOrFilepath === 'object') {
      // Old style: saveResponseToFile(prefix, response, dir)
      const prefix = prefixOrResponse;
      const response = responseOrFilepath;
      
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
    } else if (typeof prefixOrResponse === 'object' && typeof responseOrFilepath === 'string') {
      // New style: saveResponseToFile(response, filepath)
      const response = prefixOrResponse;
      const filepath = responseOrFilepath;
      const filepathDir = path.dirname(filepath);
      const base = path.basename(filepath, '.json');
      
      // Ensure directory exists
      if (!fs.existsSync(filepathDir)) {
        fs.mkdirSync(filepathDir, { recursive: true });
      }
      
      // Save raw response
      fs.writeFileSync(path.join(filepathDir, `${base}_raw.json`), response.raw || '');
      
      // Save formatted response
      if (response.data) {
        fs.writeFileSync(filepath, JSON.stringify(response.data, null, 2));
      }
      
      console.log(`Response saved to ${filepath} and ${filepathDir}/${base}_raw.json`);
    } else {
      console.error('Invalid arguments to saveResponseToFile');
    }
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
  makeAuthenticatedRequest,
  loadAuthToken,
  loadRefreshToken,
  refreshTokenIfNeeded,
  isTokenExpired,
  saveResponseToFile,
  appendTestDetails
};