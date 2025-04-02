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
 * @param {Object} options - Request options including url
 * @returns {Promise<Object>} API response
 */
function makeApiRequest(options) {
  return new Promise((resolve, reject) => {
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
              status: res.statusCode,
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
      
      if (options.data) {
        const bodyData = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
        console.log(`Request body: ${bodyData}`);
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
  loadAuthToken,
  saveResponseToFile,
  appendTestDetails
};