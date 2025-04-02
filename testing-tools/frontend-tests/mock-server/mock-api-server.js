/**
 * API Proxy Server for NIFYA Frontend Testing
 * 
 * This server acts as a proxy to the real backend API with logging capabilities.
 * It does not use mock data but instead proxies requests to the real backend.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-415554190254.us-central1.run.app';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://authentication-service-415554190254.us-central1.run.app';
const PORT = process.env.PORT || 3030;
const LOG_DIRECTORY = path.join(__dirname, '..', '..', 'outputs', 'frontend-logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(bodyParser.json());

// Request logging
app.use((req, res, next) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  // Capture request details
  const requestData = {
    id: requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  };
  
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Response body capture
  let responseBody = null;
  
  // Override response methods to capture data
  res.send = function(body) {
    responseBody = body;
    return originalSend.apply(this, arguments);
  };
  
  res.json = function(body) {
    responseBody = body;
    return originalJson.apply(this, arguments);
  };
  
  res.end = function(chunk) {
    if (chunk) {
      responseBody = chunk;
    }
    
    // Log complete request/response
    const responseData = {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: responseBody
    };
    
    const logData = {
      request: requestData,
      response: responseData,
      duration: Date.now() - new Date(requestData.timestamp).getTime()
    };
    
    // Write to log file
    const logFileName = `request-${requestId}-${Date.now()}.json`;
    const logFilePath = path.join(LOG_DIRECTORY, logFileName);
    
    fs.writeFile(logFilePath, JSON.stringify(logData, null, 2), (err) => {
      if (err) {
        console.error('Error writing log file:', err);
      }
    });
    
    return originalEnd.apply(this, arguments);
  };
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
});

// Proxy middleware
const proxyRequest = async (req, res, baseUrl) => {
  const url = `${baseUrl}${req.originalUrl}`;
  
  try {
    // Forward headers and handle authorization
    const headers = { ...req.headers };
    
    // Remove headers that might cause issues
    delete headers.host;
    
    // Forward the request to the backend
    const response = await axios({
      method: req.method,
      url,
      headers,
      data: req.body,
      validateStatus: () => true // Don't throw on non-2xx responses
    });
    
    // Forward response back to client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Proxy error for ${url}:`, error.message);
    
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(504).json({
        status: 'error',
        message: 'Gateway Timeout: No response from backend server',
        code: 'GATEWAY_TIMEOUT'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error: Could not process request',
        code: 'INTERNAL_SERVER_ERROR',
        details: error.message
      });
    }
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API proxy server is healthy',
    version: '1.0.0',
    backendUrl: BACKEND_URL,
    authServiceUrl: AUTH_SERVICE_URL
  });
});

// Auth routes - proxy to auth service
app.use('/api/auth', (req, res) => {
  proxyRequest(req, res, AUTH_SERVICE_URL);
});

// Backend API routes - proxy to backend service
app.use('/api', (req, res) => {
  proxyRequest(req, res, BACKEND_URL);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'NIFYA API Proxy Server',
    version: '1.0.0',
    status: 'running',
    proxiedServices: {
      auth: AUTH_SERVICE_URL,
      backend: BACKEND_URL
    },
    logDirectory: LOG_DIRECTORY
  });
});

// List logs endpoint
app.get('/debug/logs', (req, res) => {
  fs.readdir(LOG_DIRECTORY, (err, files) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to read logs directory',
        error: err.message
      });
    }
    
    // Sort files by time (newest first)
    files.sort().reverse();
    
    // Apply optional limit
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : files.length;
    const limitedFiles = files.slice(0, limit);
    
    res.json({
      status: 'success',
      logs: limitedFiles,
      count: limitedFiles.length,
      totalCount: files.length,
      logDirectory: LOG_DIRECTORY
    });
  });
});

// Get specific log file
app.get('/debug/logs/:filename', (req, res) => {
  const logFilePath = path.join(LOG_DIRECTORY, req.params.filename);
  
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({
        status: 'error',
        message: 'Log file not found',
        error: err.message
      });
    }
    
    try {
      const logData = JSON.parse(data);
      res.json({
        status: 'success',
        log: logData
      });
    } catch (parseErr) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to parse log file',
        error: parseErr.message
      });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`NIFYA API Proxy Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Proxying authentication requests to: ${AUTH_SERVICE_URL}`);
  console.log(`Proxying backend requests to: ${BACKEND_URL}`);
  console.log(`Storing logs in: ${LOG_DIRECTORY}`);
});

module.exports = app;