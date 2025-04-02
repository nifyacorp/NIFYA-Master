/**
 * NIFYA Testing Logger
 * 
 * Provides consistent, structured logging for test scripts with
 * console output and file logging.
 */

const fs = require('fs');
const path = require('path');

// Output directory for logs
const LOGS_DIR = path.join(__dirname, '..', 'outputs', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  TEST: 'TEST'
};

// ANSI color codes for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  DEBUG: '\x1b[90m',   // Gray
  INFO: '\x1b[36m',    // Cyan
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  SUCCESS: '\x1b[32m', // Green
  TEST: '\x1b[35m'     // Magenta
};

// Test session ID (timestamp-based)
const SESSION_ID = new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      try {
        formattedMessage += '\n' + JSON.stringify(data, null, 2);
      } catch (error) {
        formattedMessage += '\n[Error stringifying data: ' + error.message + ']';
      }
    } else {
      formattedMessage += '\n' + data;
    }
  }
  
  return formattedMessage;
}

/**
 * Write a log message to file
 * @param {string} message - Message to log
 * @param {string} [testName='general'] - Test name for log file
 */
function writeToFile(message, testName = 'general') {
  try {
    const logFile = path.join(LOGS_DIR, `${testName}-${SESSION_ID}.log`);
    fs.appendFileSync(logFile, message + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Log a message to console and file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 * @param {string} [testName='general'] - Test name for log file
 */
function log(level, message, data = null, testName = 'general') {
  const formattedMessage = formatLogMessage(level, message, data);
  
  // Console output with colors
  console.log(`${COLORS[level]}${formattedMessage}${COLORS.RESET}`);
  
  // File output
  writeToFile(formattedMessage, testName);
}

// Export logger functions for each log level
module.exports = {
  SESSION_ID,
  LOG_LEVELS,
  
  debug: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.DEBUG, message, data, testName);
  },
  
  info: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.INFO, message, data, testName);
  },
  
  warn: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.WARN, message, data, testName);
  },
  
  error: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.ERROR, message, data, testName);
  },
  
  success: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.SUCCESS, message, data, testName);
  },
  
  test: (message, data = null, testName = 'general') => {
    log(LOG_LEVELS.TEST, message, data, testName);
  },
  
  /**
   * Log test result
   * @param {string} testName - Name of the test
   * @param {boolean} success - Whether the test was successful
   * @param {string|Object} details - Test details or error
   */
  testResult: (testName, success, details) => {
    const level = success ? LOG_LEVELS.SUCCESS : LOG_LEVELS.ERROR;
    const message = `Test ${testName}: ${success ? 'PASSED' : 'FAILED'}`;
    log(level, message, details, 'test-results');
    
    // Also write to the test-details file
    const timestamp = new Date().toISOString();
    const content = `
[${timestamp}] Test: ${testName}
Status: ${success ? 'SUCCESS' : 'FAILURE'}
${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
--------------------------------------------------
`;
    try {
      fs.appendFileSync(path.join(LOGS_DIR, 'test-details.txt'), content);
    } catch (error) {
      console.error(`Failed to append test details: ${error.message}`);
    }
  }
};