#!/usr/bin/env node

/**
 * NIFYA Frontend Testing Tool
 * 
 * This tool runs frontend API communication tests using the real backend.
 * It does NOT use any mocking or fake data.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const chalk = require('chalk');
const axios = require('axios');
const { program } = require('commander');

// Import our testing tools
const networkAnalyzer = require('../network-validation/network-analyzer');
const { createProxyHtmlHandler } = require('../utils/inject-debug-tools');

// Define constants
const DEFAULT_PORT = 3030;
const LOG_DIRECTORY = path.join(__dirname, '..', '..', 'outputs', 'frontend-logs');
const RESULTS_DIRECTORY = path.join(__dirname, '..', '..', 'outputs', 'frontend-test-results');

// Ensure directories exist
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

if (!fs.existsSync(RESULTS_DIRECTORY)) {
  fs.mkdirSync(RESULTS_DIRECTORY, { recursive: true });
}

// Configure CLI
program
  .name('nifya-frontend-test')
  .description('NIFYA Frontend API Communication Testing Tool')
  .version('1.0.0');

program
  .option('-p, --port <port>', 'Port for the proxy server', DEFAULT_PORT)
  .option('-b, --backend <url>', 'Backend API URL', 'https://backend-415554190254.us-central1.run.app')
  .option('-a, --auth <url>', 'Auth Service URL', 'https://authentication-service-415554190254.us-central1.run.app')
  .option('-o, --open', 'Open browser automatically', false)
  .option('-d, --debug', 'Enable debug mode', false)
  .option('-a, --analyze', 'Run analysis on existing logs without starting server', false);

program.parse();

const options = program.opts();

/**
 * Start the proxy server
 */
async function startProxyServer() {
  // Create Express app
  const app = express();
  
  // Configure environment variables
  process.env.BACKEND_URL = options.backend;
  process.env.AUTH_SERVICE_URL = options.auth;
  
  console.log(chalk.blue('Starting NIFYA Frontend Testing Proxy...'));
  console.log(chalk.gray(`Backend API: ${options.backend}`));
  console.log(chalk.gray(`Auth Service: ${options.auth}`));
  
  // HTML middleware to inject debug tools
  app.use(createProxyHtmlHandler());
  
  // Serve the API proxy 
  const apiProxy = require('../mock-server/mock-api-server');
  app.use('/', apiProxy);
  
  // Start server
  const server = app.listen(options.port, () => {
    console.log(chalk.green(`\nProxy server running at http://localhost:${options.port}`));
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
    // Open browser if requested
    if (options.open) {
      openBrowser(`http://localhost:${options.port}`);
    }
  });
  
  // Handle server shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nShutting down server...'));
    server.close();
    
    console.log(chalk.blue('\nRunning network analysis...'));
    await runNetworkAnalysis();
    
    process.exit(0);
  });
}

/**
 * Open the browser
 */
function openBrowser(url) {
  let command;
  let args;
  
  switch (process.platform) {
    case 'darwin': // macOS
      command = 'open';
      args = [url];
      break;
    case 'win32': // Windows
      command = 'cmd';
      args = ['/c', 'start', url];
      break;
    default: // Linux and others
      command = 'xdg-open';
      args = [url];
      break;
  }
  
  try {
    spawn(command, args, { stdio: 'ignore' });
  } catch (err) {
    console.error(chalk.red(`Failed to open browser: ${err.message}`));
  }
}

/**
 * Run network analysis on collected logs
 */
async function runNetworkAnalysis() {
  console.log(chalk.blue('Running network analysis...'));
  
  try {
    const results = await networkAnalyzer.runNetworkAnalysis();
    
    if (results.status === 'warning') {
      console.log(chalk.yellow(results.message));
      return;
    }
    
    // Print summary
    console.log(chalk.green(`\nAnalysis completed: ${results.totalLogsAnalyzed} logs analyzed`));
    
    if (results.summary.totalIssuesFound === 0) {
      console.log(chalk.green('✓ No issues found!'));
    } else {
      console.log(chalk.yellow(`⚠ Found ${results.summary.totalIssuesFound} issues:`));
      
      if (results.summary.authIssues > 0) {
        console.log(chalk.yellow(`  - ${results.summary.authIssues} authentication issues`));
      }
      
      if (results.summary.apiIssues > 0) {
        console.log(chalk.yellow(`  - ${results.summary.apiIssues} API endpoint issues`));
      }
      
      if (results.summary.headerIssues > 0) {
        console.log(chalk.yellow(`  - ${results.summary.headerIssues} request header issues`));
      }
      
      if (results.summary.corsIssues > 0) {
        console.log(chalk.yellow(`  - ${results.summary.corsIssues} CORS issues`));
      }
    }
    
    // Print connectivity status
    console.log(chalk.blue('\nBackend connectivity:'));
    
    if (results.connectivityStatus.backend.status === 'healthy') {
      console.log(chalk.green(`  ✓ Backend: ${results.connectivityStatus.backend.status} (${results.connectivityStatus.backend.responseTime}ms)`));
    } else {
      console.log(chalk.red(`  ✗ Backend: ${results.connectivityStatus.backend.status} - ${results.connectivityStatus.backend.error || 'Unknown error'}`));
    }
    
    if (results.connectivityStatus.auth.status === 'healthy') {
      console.log(chalk.green(`  ✓ Auth: ${results.connectivityStatus.auth.status} (${results.connectivityStatus.auth.responseTime}ms)`));
    } else {
      console.log(chalk.red(`  ✗ Auth: ${results.connectivityStatus.auth.status} - ${results.connectivityStatus.auth.error || 'Unknown error'}`));
    }
    
    // Save HTML report
    const reportPath = await saveHtmlReport(results);
    console.log(chalk.blue(`\nDetailed report saved to: ${reportPath}`));
    
    return results;
  } catch (err) {
    console.error(chalk.red(`Analysis failed: ${err.message}`));
    if (options.debug) {
      console.error(err);
    }
  }
}

/**
 * Generate an HTML report from analysis results
 */
async function saveHtmlReport(results) {
  // Create a simple HTML report
  const reportFile = path.join(RESULTS_DIRECTORY, `frontend-test-report-${Date.now()}.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NIFYA Frontend Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
      padding: 20px;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }
    .summary-card {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      border-radius: 8px;
      color: white;
      text-align: center;
    }
    .good {
      background-color: #4caf50;
    }
    .warning {
      background-color: #ff9800;
    }
    .error {
      background-color: #f44336;
    }
    .neutral {
      background-color: #2196f3;
    }
    .issue-list {
      margin-top: 20px;
    }
    .issue {
      border-left: 4px solid #ff9800;
      padding: 10px;
      margin-bottom: 10px;
      background-color: #fff8e1;
    }
    .issue.error {
      border-left-color: #f44336;
      background-color: #ffebee;
    }
    .issue.warning {
      border-left-color: #ff9800;
      background-color: #fff8e1;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .collapse-toggle {
      cursor: pointer;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 10px;
      user-select: none;
    }
    .collapse-content {
      display: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <h1>NIFYA Frontend Test Report</h1>
  <p>Report generated at: ${new Date(results.timestamp).toLocaleString()}</p>
  
  <div class="card">
    <h2>Summary</h2>
    <div class="summary">
      <div class="summary-card neutral">
        <h3>${results.totalLogsAnalyzed}</h3>
        <p>Logs Analyzed</p>
      </div>
      <div class="summary-card ${results.summary.totalIssuesFound > 0 ? 'warning' : 'good'}">
        <h3>${results.summary.totalIssuesFound}</h3>
        <p>Issues Found</p>
      </div>
      <div class="summary-card ${results.connectivityStatus.backend.status === 'healthy' ? 'good' : 'error'}">
        <h3>${results.connectivityStatus.backend.status === 'healthy' ? 'Healthy' : 'Error'}</h3>
        <p>Backend Status</p>
      </div>
      <div class="summary-card ${results.connectivityStatus.auth.status === 'healthy' ? 'good' : 'error'}">
        <h3>${results.connectivityStatus.auth.status === 'healthy' ? 'Healthy' : 'Error'}</h3>
        <p>Auth Status</p>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>Server Information</h2>
    <table>
      <tr>
        <th>Component</th>
        <th>URL</th>
        <th>Status</th>
        <th>Response Time</th>
      </tr>
      <tr>
        <td>Backend API</td>
        <td>${results.connectivityStatus.backend.url}</td>
        <td>${results.connectivityStatus.backend.status}</td>
        <td>${results.connectivityStatus.backend.responseTime || 'N/A'} ms</td>
      </tr>
      <tr>
        <td>Auth Service</td>
        <td>${results.connectivityStatus.auth.url}</td>
        <td>${results.connectivityStatus.auth.status}</td>
        <td>${results.connectivityStatus.auth.responseTime || 'N/A'} ms</td>
      </tr>
    </table>
  </div>
  
  ${renderIssues('Authentication Issues', results.details.authIssues, renderAuthIssue)}
  ${renderIssues('API Endpoint Issues', results.details.apiIssues, renderApiIssue)}
  ${renderIssues('Header Issues', results.details.headerIssues, renderHeaderIssue)}
  ${renderIssues('CORS Issues', results.details.corsIssues, renderCorsIssue)}
  
  <div class="card">
    <h2>Test Data</h2>
    <div class="collapse-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
      ▶ Raw Test Results (click to toggle)
    </div>
    <div class="collapse-content">
      <pre>${JSON.stringify(results, null, 2)}</pre>
    </div>
  </div>
  
  <script>
    // Initialize toggle state
    document.addEventListener('DOMContentLoaded', function() {
      const toggles = document.querySelectorAll('.collapse-toggle');
      toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
          this.textContent = this.textContent.startsWith('▶') 
            ? this.textContent.replace('▶', '▼') 
            : this.textContent.replace('▼', '▶');
        });
      });
    });
  </script>
</body>
</html>
  `;
  
  // Helper function to render issues
  function renderIssues(title, issues, renderFunc) {
    if (!issues || issues.length === 0) {
      return `
      <div class="card">
        <h2>${title}</h2>
        <p>No issues found. ✓</p>
      </div>
      `;
    }
    
    return `
    <div class="card">
      <h2>${title}</h2>
      <p>Found ${issues.length} issues:</p>
      <div class="issue-list">
        ${issues.map(renderFunc).join('')}
      </div>
    </div>
    `;
  }
  
  // Helper functions to render different issue types
  function renderAuthIssue(issue) {
    return `
    <div class="issue error">
      <h3>${issue.method} ${issue.url}</h3>
      <p>Status: ${issue.statusCode}</p>
      <p>Error: ${issue.errorMessage}</p>
      <p>Code: ${issue.errorCode}</p>
      <p>Time: ${new Date(issue.timestamp).toLocaleString()}</p>
    </div>
    `;
  }
  
  function renderApiIssue(issue) {
    return `
    <div class="issue warning">
      <h3>${issue.endpoint}</h3>
      <p>Total Requests: ${issue.totalRequests}</p>
      <p>Failed Requests: ${issue.failedRequests}</p>
      <p>Error Rate: ${(issue.errorRate * 100).toFixed(2)}%</p>
      <p>Avg Response Time: ${issue.avgResponseTime.toFixed(2)} ms</p>
      ${issue.examples.length > 0 ? `
        <div class="collapse-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
          ▶ Examples (click to toggle)
        </div>
        <div class="collapse-content">
          <ul>
            ${issue.examples.map(ex => `
              <li>
                ${ex.method} ${ex.url} - Status: ${ex.statusCode}, Time: ${new Date(ex.timestamp).toLocaleString()}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    `;
  }
  
  function renderHeaderIssue(issue) {
    return `
    <div class="issue warning">
      <h3>${issue.method} ${issue.url}</h3>
      <p>Issue: ${issue.issue}</p>
      <p>Status: ${issue.statusCode}</p>
      <p>Time: ${new Date(issue.timestamp).toLocaleString()}</p>
      ${issue.hasAuthHeader ? `<p>Auth Header: ${issue.authHeaderValue}</p>` : ''}
    </div>
    `;
  }
  
  function renderCorsIssue(issue) {
    return `
    <div class="issue error">
      <h3>${issue.method} ${issue.url}</h3>
      <p>Status: ${issue.statusCode}</p>
      <p>Origin: ${issue.requestOrigin}</p>
      <p>Time: ${new Date(issue.timestamp).toLocaleString()}</p>
      <div class="collapse-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
        ▶ Response Headers (click to toggle)
      </div>
      <div class="collapse-content">
        <pre>${JSON.stringify(issue.responseHeaders, null, 2)}</pre>
      </div>
    </div>
    `;
  }
  
  // Write the HTML to file
  fs.writeFileSync(reportFile, html);
  
  return reportFile;
}

// Main function
async function main() {
  console.log(chalk.blue('NIFYA Frontend Testing Tool'));
  
  if (options.analyze) {
    // Just run analysis without starting server
    await runNetworkAnalysis();
    return;
  }
  
  // Start the proxy server
  await startProxyServer();
}

// Run the app
main().catch(err => {
  console.error(chalk.red(`Error: ${err.message}`));
  
  if (options.debug) {
    console.error(err);
  }
  
  process.exit(1);
});