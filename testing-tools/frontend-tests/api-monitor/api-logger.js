/**
 * API Logger for NIFYA Frontend
 * 
 * This tool intercepts all API requests/responses between the frontend and backend
 * to help debug communication issues.
 */

// Storage for intercepted requests
let apiLogs = [];
const MAX_LOGS = 100;

// Event name for communication
const API_LOG_EVENT = 'nifya:api-log';

/**
 * API Log entry structure
 * @typedef {Object} ApiLogEntry
 * @property {string} id - Unique ID for this request/response pair
 * @property {string} timestamp - When the request was initiated
 * @property {string} method - HTTP method (GET, POST, etc.)
 * @property {string} url - Full URL of the request
 * @property {Object} requestHeaders - Headers sent with the request
 * @property {Object|null} requestBody - Body sent with the request (if any)
 * @property {number|null} status - HTTP status code (if response received)
 * @property {Object|null} responseHeaders - Headers received in the response
 * @property {Object|null} responseBody - Body received in the response
 * @property {number|null} duration - Time taken for the request in ms
 * @property {boolean} isError - Whether this request resulted in an error
 * @property {string|null} errorMessage - Error message if applicable
 */

/**
 * Initialize the API logger by intercepting fetch and XMLHttpRequest
 */
function initApiLogger() {
  // Don't initialize twice
  if (window._nifyaApiLoggerInitialized) {
    return;
  }
  
  interceptFetch();
  interceptXhr();
  
  window._nifyaApiLoggerInitialized = true;
  console.log('🔍 NIFYA API Logger initialized');
  
  // Create an info message as the first log entry
  addLogEntry({
    id: 'logger-init',
    timestamp: new Date().toISOString(),
    method: 'INFO',
    url: 'Logger Initialized',
    requestHeaders: {},
    requestBody: null,
    status: null,
    responseHeaders: null,
    responseBody: null,
    duration: 0,
    isError: false,
    errorMessage: null
  });
}

/**
 * Intercept all fetch requests
 */
function interceptFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(resource, options = {}) {
    const requestId = generateId();
    const startTime = performance.now();
    const method = options.method || 'GET';
    let url = resource;
    
    // If resource is a Request object, extract URL
    if (resource instanceof Request) {
      url = resource.url;
    }
    
    // Create initial log entry
    const logEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: method,
      url: url,
      requestHeaders: options.headers || {},
      requestBody: null,
      status: null,
      responseHeaders: null,
      responseBody: null,
      duration: null,
      isError: false,
      errorMessage: null
    };
    
    // Try to parse request body if present
    if (options.body) {
      try {
        // Check if body is already a parsed object
        if (typeof options.body === 'object' && !(options.body instanceof FormData)) {
          logEntry.requestBody = options.body;
        } else if (typeof options.body === 'string') {
          logEntry.requestBody = JSON.parse(options.body);
        }
      } catch (e) {
        // If not JSON, store as string
        logEntry.requestBody = String(options.body).substring(0, 1000); // Limit size
      }
    }
    
    // Add initial log entry
    addLogEntry(logEntry);
    
    try {
      // Make the actual request
      const response = await originalFetch.apply(this, arguments);
      const duration = performance.now() - startTime;
      
      // Clone the response so we can read the body
      const clonedResponse = response.clone();
      
      // Update log entry with response info
      logEntry.status = response.status;
      logEntry.duration = duration;
      logEntry.isError = !response.ok;
      
      // Extract response headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      logEntry.responseHeaders = responseHeaders;
      
      // Try to read response body
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseBody = await clonedResponse.json();
          logEntry.responseBody = responseBody;
        } else {
          const text = await clonedResponse.text();
          logEntry.responseBody = text.substring(0, 1000); // Limit size
        }
      } catch (e) {
        logEntry.errorMessage = `Failed to parse response body: ${e.message}`;
      }
      
      // Update log entry
      updateLogEntry(logEntry);
      
      return response;
    } catch (error) {
      // Handle network errors
      const duration = performance.now() - startTime;
      
      logEntry.duration = duration;
      logEntry.isError = true;
      logEntry.errorMessage = error.message;
      
      // Update log entry
      updateLogEntry(logEntry);
      
      throw error;
    }
  };
}

/**
 * Intercept all XMLHttpRequest calls
 */
function interceptXhr() {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._nifyaApiLogData = {
      id: generateId(),
      method: method,
      url: url,
      startTime: 0,
      requestHeaders: {},
      requestBody: null
    };
    return originalOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    if (this._nifyaApiLogData) {
      this._nifyaApiLogData.startTime = performance.now();
      
      // Try to parse request body
      if (body) {
        try {
          if (typeof body === 'string') {
            this._nifyaApiLogData.requestBody = JSON.parse(body);
          } else {
            this._nifyaApiLogData.requestBody = body;
          }
        } catch (e) {
          this._nifyaApiLogData.requestBody = String(body).substring(0, 1000);
        }
      }
      
      // Create initial log entry
      const logEntry = {
        id: this._nifyaApiLogData.id,
        timestamp: new Date().toISOString(),
        method: this._nifyaApiLogData.method,
        url: this._nifyaApiLogData.url,
        requestHeaders: this._nifyaApiLogData.requestHeaders,
        requestBody: this._nifyaApiLogData.requestBody,
        status: null,
        responseHeaders: null,
        responseBody: null,
        duration: null,
        isError: false,
        errorMessage: null
      };
      
      addLogEntry(logEntry);
      
      // Listen for load and error events
      this.addEventListener('load', function() {
        const duration = performance.now() - this._nifyaApiLogData.startTime;
        
        // Update log entry
        logEntry.status = this.status;
        logEntry.duration = duration;
        logEntry.isError = this.status < 200 || this.status >= 300;
        
        // Extract response headers
        logEntry.responseHeaders = parseXhrHeaders(this.getAllResponseHeaders());
        
        // Parse response
        try {
          const contentType = this.getResponseHeader('content-type');
          if (contentType && contentType.includes('application/json')) {
            logEntry.responseBody = JSON.parse(this.responseText);
          } else {
            logEntry.responseBody = this.responseText.substring(0, 1000);
          }
        } catch (e) {
          logEntry.errorMessage = `Failed to parse response body: ${e.message}`;
        }
        
        updateLogEntry(logEntry);
      });
      
      this.addEventListener('error', function() {
        const duration = performance.now() - this._nifyaApiLogData.startTime;
        
        logEntry.duration = duration;
        logEntry.isError = true;
        logEntry.errorMessage = 'Network error';
        
        updateLogEntry(logEntry);
      });
      
      // Track header setting
      const originalSetRequestHeader = this.setRequestHeader;
      this.setRequestHeader = (name, value) => {
        this._nifyaApiLogData.requestHeaders[name] = value;
        return originalSetRequestHeader.call(this, name, value);
      };
    }
    
    return originalSend.apply(this, arguments);
  };
}

/**
 * Parse XHR headers string into an object
 */
function parseXhrHeaders(headersString) {
  const headers = {};
  if (!headersString) {
    return headers;
  }
  
  const headerPairs = headersString.trim().split('\r\n');
  for (let i = 0; i < headerPairs.length; i++) {
    const headerPair = headerPairs[i];
    const index = headerPair.indexOf(': ');
    if (index > 0) {
      const key = headerPair.substring(0, index);
      const val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }
  
  return headers;
}

/**
 * Generate a random ID for the request
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Add a new log entry
 */
function addLogEntry(entry) {
  apiLogs.unshift(entry);
  
  // Cap the number of logs
  if (apiLogs.length > MAX_LOGS) {
    apiLogs.length = MAX_LOGS;
  }
  
  // Dispatch event
  dispatchLogEvent(entry);
}

/**
 * Update an existing log entry
 */
function updateLogEntry(entry) {
  const index = apiLogs.findIndex(log => log.id === entry.id);
  if (index !== -1) {
    apiLogs[index] = entry;
    dispatchLogEvent(entry, true);
  }
}

/**
 * Dispatch a custom event with the log data
 */
function dispatchLogEvent(entry, isUpdate = false) {
  const event = new CustomEvent(API_LOG_EVENT, {
    detail: {
      entry,
      isUpdate,
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(event);
}

/**
 * Get all log entries
 */
function getApiLogs() {
  return [...apiLogs];
}

/**
 * Clear all log entries
 */
function clearApiLogs() {
  apiLogs = [];
  
  // Dispatch clear event
  window.dispatchEvent(new CustomEvent(`${API_LOG_EVENT}:clear`));
  
  return true;
}

/**
 * Filter logs based on criteria
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.url] - URL substring to match
 * @param {string} [filters.method] - HTTP method to match
 * @param {boolean} [filters.onlyErrors] - Only return errors
 * @param {number} [filters.status] - Status code to match
 */
function filterApiLogs(filters = {}) {
  return apiLogs.filter(log => {
    if (filters.url && !log.url.includes(filters.url)) {
      return false;
    }
    
    if (filters.method && log.method !== filters.method) {
      return false;
    }
    
    if (filters.onlyErrors && !log.isError) {
      return false;
    }
    
    if (filters.status && log.status !== filters.status) {
      return false;
    }
    
    return true;
  });
}

// Export the API
module.exports = {
  initApiLogger,
  getApiLogs,
  clearApiLogs,
  filterApiLogs,
  API_LOG_EVENT
};