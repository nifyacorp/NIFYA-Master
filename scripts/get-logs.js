#!/usr/bin/env node
/**
 * NIFYA Cloud Service Log Retrieval Tool
 * 
 * Usage: node get-logs.js [service] [filter] [limit]
 * 
 * Examples:
 *   node get-logs.js                      # Fetch 20 logs from backend service
 *   node get-logs.js backend              # Fetch 20 logs from backend service
 *   node get-logs.js backend migration    # Fetch logs containing "migration" from backend
 *   node get-logs.js backend error 50     # Fetch 50 logs containing "error" from backend
 *   node get-logs.js auth                 # Fetch logs from authentication service
 *   node get-logs.js worker database      # Fetch logs containing "database" from worker
 */

const { makeApiRequest } = require('./api-client');
const fs = require('fs');

// Default settings
const DEFAULT_SERVICE = 'backend';
const DEFAULT_LIMIT = 20;

// Parse command line arguments
const service = process.argv[2] || DEFAULT_SERVICE;
const filter = process.argv[3] || '';
const limit = parseInt(process.argv[4], 10) || DEFAULT_LIMIT;

async function fetchLogs(service, filter, limit) {
  console.log(`Fetching ${limit} logs from '${service}' service${filter ? ` containing '${filter}'` : ''}...`);
  
  try {
    // Request options for the log endpoint service
    const options = {
      hostname: 'logendpoint-415554190254.us-central1.run.app',
      port: 443,
      path: '/query-logs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'nifya'
      }
    };
    
    // Request body per API documentation
    const body = {
      service,
      limit
    };
    
    // Add filter if provided
    if (filter) {
      body.filter = `textPayload:"${filter}"`;
    }
    
    // Make the request
    const response = await makeApiRequest(options, null, body);
    
    if (response.statusCode === 200) {
      // Process and display logs
      if (response.data && response.data.logs && response.data.logs.length > 0) {
        console.log(`\n✅ Found ${response.data.logs.length} log entries for service '${response.data.service}'\n`);
        
        // Create output string for file
        let outputContent = '';
        
        response.data.logs.forEach(log => {
          const timestamp = log.timestamp || new Date().toISOString();
          const severity = log.severity || 'INFO';
          let message = '';
          
          // Extract message from different possible formats
          if (typeof log.message === 'string') {
            message = log.message;
          } else if (log.textPayload) {
            message = log.textPayload;
          } else if (log.jsonPayload) {
            message = JSON.stringify(log.jsonPayload);
          } else {
            message = JSON.stringify(log);
          }
          
          // Add to output file content
          outputContent += `[${timestamp}] ${severity}: ${message}\n\n`;
          
          // Print with color based on severity and content
          if (severity === 'ERROR') {
            console.log('\x1b[31m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Red
          } else if (severity === 'WARNING') {
            console.log('\x1b[33m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Yellow
          } else if (filter && message.toLowerCase().includes(filter.toLowerCase())) {
            console.log('\x1b[36m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Cyan for matches
          } else if (message.includes('migration') || message.includes('database')) {
            console.log('\x1b[36m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Cyan
          } else if (message.includes('error') || message.includes('fail')) {
            console.log('\x1b[31m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Red for errors
          } else {
            console.log(`[${timestamp}] ${severity}: ${message}`);
          }
        });
        
        // Save logs to file
        const safeService = service.replace(/[^a-zA-Z0-9]/g, '-');
        const safeFilter = filter ? `-${filter.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
        const outputFile = `${safeService}${safeFilter}-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
        fs.writeFileSync(outputFile, outputContent);
        console.log(`\nLogs saved to ${outputFile}`);
        
        // Stats
        const errorCount = response.data.logs.filter(log => 
          log.severity === 'ERROR' || 
          (log.textPayload && log.textPayload.toLowerCase().includes('error'))
        ).length;
        
        const filterMatchCount = filter ? response.data.logs.filter(log => 
          (log.textPayload && log.textPayload.toLowerCase().includes(filter.toLowerCase()))
        ).length : 0;
        
        console.log(`\n📊 Log Statistics:`);
        console.log(`   Total Entries: ${response.data.logs.length}`);
        console.log(`   Errors: ${errorCount}`);
        if (filter) {
          console.log(`   Filter '${filter}' matches: ${filterMatchCount}`);
        }
        
      } else {
        console.log('\n❌ No logs found matching your criteria');
      }
    } else {
      console.log('Error response:');
      console.log(response.raw);
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

// Run the function with provided arguments
fetchLogs(service, filter, limit);