/**
 * Backend Logs Fetcher using the dedicated log endpoint service
 * 
 * Based on the API documentation, this uses POST to /query-logs with proper formatting
 */

const { makeApiRequest } = require('./api-client');
const fs = require('fs');

async function fetchBackendLogs() {
  console.log('Fetching backend logs from log endpoint service...');
  
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
      service: 'backend',
      filter: 'textPayload:"migration"',
      limit: 50
    };
    
    // Make the request
    const response = await makeApiRequest(options, null, body);
    
    console.log(`Status code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      // Process and display logs
      if (response.data && response.data.logs) {
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
          
          // Print with color based on severity
          if (severity === 'ERROR') {
            console.log('\x1b[31m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Red
          } else if (severity === 'WARNING') {
            console.log('\x1b[33m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Yellow
          } else if (message.includes('migration') || message.includes('database')) {
            console.log('\x1b[36m%s\x1b[0m', `[${timestamp}] ${severity}: ${message}`); // Cyan
          } else {
            console.log(`[${timestamp}] ${severity}: ${message}`);
          }
        });
        
        // Save logs to file
        const outputFile = `backend-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
        fs.writeFileSync(outputFile, outputContent);
        console.log(`\nLogs saved to ${outputFile}`);
        
        // Stats
        const errorCount = response.data.logs.filter(log => 
          log.severity === 'ERROR' || 
          (log.textPayload && log.textPayload.toLowerCase().includes('error'))
        ).length;
        
        const migrationCount = response.data.logs.filter(log => 
          (log.textPayload && log.textPayload.toLowerCase().includes('migration'))
        ).length;
        
        console.log(`\n📊 Log Statistics:`);
        console.log(`   Total Entries: ${response.data.logs.length}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Migration-related: ${migrationCount}`);
        
      } else {
        console.log('No logs found in the response');
        console.log(JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('Error response:');
      console.log(response.raw);
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

// Run the function
fetchBackendLogs();