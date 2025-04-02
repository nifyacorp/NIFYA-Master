/**
 * Network Analyzer for NIFYA Frontend
 * 
 * This utility analyzes network communication between the frontend and backend
 * to identify common issues.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Path to log directory
const LOG_DIRECTORY = path.join(__dirname, '..', '..', 'outputs', 'frontend-logs');

/**
 * Read all log files from the directory
 */
async function readAllLogs() {
  try {
    // Ensure directory exists
    if (!fs.existsSync(LOG_DIRECTORY)) {
      fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(LOG_DIRECTORY);
    
    // Sort by date (newest first)
    files.sort().reverse();
    
    const logs = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(LOG_DIRECTORY, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const log = JSON.parse(content);
          logs.push(log);
        } catch (err) {
          console.error(`Error reading log file ${file}:`, err);
        }
      }
    }
    
    return logs;
  } catch (err) {
    console.error('Error reading logs directory:', err);
    return [];
  }
}

/**
 * Analyze logs for authentication issues
 */
async function analyzeAuthIssues(logs) {
  const authIssues = [];
  const authLogs = logs.filter(log => {
    // Find auth-related requests
    return (
      log.request.url.includes('/auth/login') ||
      log.request.url.includes('/auth/refresh') ||
      log.request.url.includes('/auth/logout')
    );
  });
  
  // Look for failed auth requests
  const failedAuthAttempts = authLogs.filter(log => {
    return log.response.statusCode >= 400;
  });
  
  for (const failedAttempt of failedAuthAttempts) {
    let issue = {
      type: 'AUTH_ERROR',
      url: failedAttempt.request.url,
      method: failedAttempt.request.method,
      statusCode: failedAttempt.response.statusCode,
      timestamp: failedAttempt.request.timestamp,
      requestId: failedAttempt.request.id
    };
    
    // Parse response body
    let responseBody;
    try {
      if (typeof failedAttempt.response.body === 'string') {
        responseBody = JSON.parse(failedAttempt.response.body);
      } else {
        responseBody = failedAttempt.response.body;
      }
      
      issue.errorMessage = responseBody.message || responseBody.error || 'Unknown error';
      issue.errorCode = responseBody.code || 'UNKNOWN_ERROR';
      issue.details = responseBody;
    } catch (err) {
      issue.errorMessage = 'Failed to parse response body';
      issue.error = err.message;
    }
    
    authIssues.push(issue);
  }
  
  return authIssues;
}

/**
 * Analyze logs for API endpoint issues
 */
async function analyzeApiIssues(logs) {
  const apiIssues = [];
  
  // Filter API requests (excluding auth)
  const apiLogs = logs.filter(log => {
    return (
      log.request.url.startsWith('/api') &&
      !log.request.url.includes('/auth/')
    );
  });
  
  // Group by endpoint
  const endpointGroups = {};
  
  for (const log of apiLogs) {
    // Extract endpoint pattern (remove query params and IDs)
    let endpoint = log.request.url.split('?')[0];
    
    // Replace UUIDs with :id
    endpoint = endpoint.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:id');
    
    // Group by method + endpoint
    const key = `${log.request.method} ${endpoint}`;
    
    if (!endpointGroups[key]) {
      endpointGroups[key] = [];
    }
    
    endpointGroups[key].push(log);
  }
  
  // Analyze each endpoint group
  for (const [endpoint, logs] of Object.entries(endpointGroups)) {
    // Calculate error rate
    const totalRequests = logs.length;
    const failedRequests = logs.filter(log => log.response.statusCode >= 400).length;
    const errorRate = failedRequests / totalRequests;
    
    // Calculate avg response time
    const totalResponseTime = logs.reduce((sum, log) => sum + log.duration, 0);
    const avgResponseTime = totalResponseTime / totalRequests;
    
    // If error rate > 0 or response time is high, flag it
    if (errorRate > 0 || avgResponseTime > 1000) {
      apiIssues.push({
        type: 'API_ENDPOINT_ISSUE',
        endpoint,
        totalRequests,
        failedRequests,
        errorRate,
        avgResponseTime,
        mostRecentError: logs
          .filter(log => log.response.statusCode >= 400)
          .sort((a, b) => new Date(b.request.timestamp) - new Date(a.request.timestamp))[0],
        examples: logs
          .filter(log => log.response.statusCode >= 400)
          .slice(0, 3)
          .map(log => ({
            requestId: log.request.id,
            url: log.request.url,
            method: log.request.method,
            statusCode: log.response.statusCode,
            timestamp: log.request.timestamp,
            duration: log.duration
          }))
      });
    }
  }
  
  return apiIssues;
}

/**
 * Analyze logs for authorization/header issues
 */
async function analyzeHeaderIssues(logs) {
  const headerIssues = [];
  
  // Find requests with missing or malformed authorization headers
  const authHeaderIssues = logs.filter(log => {
    // Find requests with 401 errors
    return (
      log.response.statusCode === 401 &&
      !log.request.url.includes('/auth/login') &&
      !log.request.url.includes('/auth/refresh')
    );
  });
  
  for (const issue of authHeaderIssues) {
    const headers = issue.request.headers || {};
    const authHeader = headers.authorization || headers.Authorization;
    
    headerIssues.push({
      type: 'AUTH_HEADER_ISSUE',
      url: issue.request.url,
      method: issue.request.method,
      statusCode: issue.response.statusCode,
      timestamp: issue.request.timestamp,
      requestId: issue.request.id,
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? `${authHeader.substring(0, 15)}...` : null,
      issue: !authHeader 
        ? 'Missing Authorization header' 
        : !authHeader.startsWith('Bearer ') 
        ? 'Authorization header missing Bearer prefix' 
        : 'Invalid or expired token'
    });
  }
  
  return headerIssues;
}

/**
 * Analyze logs for CORS issues
 */
async function analyzeCorsIssues(logs) {
  const corsIssues = [];
  
  // Find requests with CORS errors
  const corsErrors = logs.filter(log => {
    const responseHeaders = log.response.headers || {};
    
    // Check for CORS-related issues
    return (
      log.response.statusCode === 0 || // Browser blocked request
      responseHeaders['access-control-allow-origin'] === undefined || // Missing CORS headers
      log.request.method === 'OPTIONS' && log.response.statusCode !== 200 // Preflight failure
    );
  });
  
  for (const issue of corsErrors) {
    corsIssues.push({
      type: 'CORS_ISSUE',
      url: issue.request.url,
      method: issue.request.method,
      statusCode: issue.response.statusCode,
      timestamp: issue.request.timestamp,
      requestId: issue.request.id,
      requestOrigin: issue.request.headers?.origin || 'Unknown',
      responseHeaders: issue.response.headers
    });
  }
  
  return corsIssues;
}

/**
 * Check real-time connectivity to the backend
 */
async function checkBackendConnectivity() {
  const backendUrl = process.env.BACKEND_URL || 'https://backend-415554190254.us-central1.run.app';
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://authentication-service-415554190254.us-central1.run.app';
  
  const results = {
    timestamp: new Date().toISOString(),
    backend: {
      url: backendUrl,
      status: 'unknown',
      responseTime: 0,
      error: null
    },
    auth: {
      url: authServiceUrl,
      status: 'unknown',
      responseTime: 0,
      error: null
    }
  };
  
  // Test backend connectivity
  try {
    const startTime = Date.now();
    const response = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
    results.backend.status = response.status === 200 ? 'healthy' : 'unhealthy';
    results.backend.responseTime = Date.now() - startTime;
    results.backend.details = response.data;
  } catch (err) {
    results.backend.status = 'error';
    results.backend.error = err.message;
    if (err.response) {
      results.backend.statusCode = err.response.status;
    }
  }
  
  // Test auth service connectivity
  try {
    const startTime = Date.now();
    const response = await axios.get(`${authServiceUrl}/health`, { timeout: 5000 });
    results.auth.status = response.status === 200 ? 'healthy' : 'unhealthy';
    results.auth.responseTime = Date.now() - startTime;
    results.auth.details = response.data;
  } catch (err) {
    results.auth.status = 'error';
    results.auth.error = err.message;
    if (err.response) {
      results.auth.statusCode = err.response.status;
    }
  }
  
  return results;
}

/**
 * Run a comprehensive network analysis
 */
async function runNetworkAnalysis() {
  const logs = await readAllLogs();
  
  // Skip if no logs found
  if (logs.length === 0) {
    return {
      status: 'warning',
      message: 'No log files found for analysis',
      timestamp: new Date().toISOString(),
      logsDirectory: LOG_DIRECTORY
    };
  }
  
  // Run all analyses
  const [authIssues, apiIssues, headerIssues, corsIssues, connectivityResults] = await Promise.all([
    analyzeAuthIssues(logs),
    analyzeApiIssues(logs),
    analyzeHeaderIssues(logs),
    analyzeCorsIssues(logs),
    checkBackendConnectivity()
  ]);
  
  // Compile report
  const report = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    totalLogsAnalyzed: logs.length,
    dateRange: {
      oldest: logs[logs.length - 1]?.request.timestamp,
      newest: logs[0]?.request.timestamp
    },
    connectivityStatus: connectivityResults,
    summary: {
      authIssues: authIssues.length,
      apiEndpointIssues: apiIssues.length,
      headerIssues: headerIssues.length,
      corsIssues: corsIssues.length,
      totalIssuesFound: authIssues.length + apiIssues.length + headerIssues.length + corsIssues.length
    },
    details: {
      authIssues,
      apiIssues,
      headerIssues,
      corsIssues
    }
  };
  
  // Save report
  const reportFilePath = path.join(LOG_DIRECTORY, `network-analysis-${Date.now()}.json`);
  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
  
  return {
    ...report,
    reportFile: reportFilePath
  };
}

module.exports = {
  readAllLogs,
  analyzeAuthIssues,
  analyzeApiIssues,
  analyzeHeaderIssues,
  analyzeCorsIssues,
  checkBackendConnectivity,
  runNetworkAnalysis
};