/**
 * NIFYA Notification Pipeline Analysis
 * 
 * This script analyzes the notification pipeline from BOE Parser to Notification Worker,
 * focusing on message format issues and PubSub communication.
 */

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const config = {
  services: {
    boeParser: {
      baseUrl: 'boe-parser-415554190254.us-central1.run.app',
      healthEndpoint: '/health'
    },
    notificationWorker: {
      baseUrl: 'notification-worker-415554190254.us-central1.run.app', 
      healthEndpoint: '/health'
    },
    backend: {
      baseUrl: 'backend-415554190254.us-central1.run.app',
      healthEndpoint: '/health'
    }
  },
  auth: {
    baseUrl: 'authentication-service-415554190254.us-central1.run.app',
    credentials: {
      email: 'ratonxi@gmail.com',
      password: 'nifyaCorp12!'
    }
  },
  outputDir: './',
  reportFile: 'notification_pipeline_analysis.md'
};

// State
const state = {
  accessToken: null,
  userId: null,
  serviceStatus: {},
  messageSchemas: {
    boeParserOutput: null,
    notificationWorkerInput: null
  },
  schemaAnalysis: null
};

// Initialize report
fs.writeFileSync(config.reportFile, `# NIFYA Notification Pipeline Analysis

This report analyzes the notification pipeline from BOE Parser to Notification Worker.

Generated: ${new Date().toISOString()}

`);

// Helper to append to report
function appendToReport(content) {
  fs.appendFileSync(config.reportFile, content + '\n');
}

// Helper for making HTTP requests
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    console.log(`Making ${options.method || 'GET'} request to ${options.hostname}${options.path}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          // Try to parse JSON response
          let parsedData = null;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = { raw: data.substring(0, 200) + (data.length > 200 ? '...' : '') };
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    
    req.end();
  });
}

// Check service health endpoints
async function checkServiceHealth() {
  appendToReport(`## Service Health Status\n`);
  
  for (const [serviceName, service] of Object.entries(config.services)) {
    try {
      const options = {
        hostname: service.baseUrl,
        port: 443,
        path: service.healthEndpoint,
        method: 'GET'
      };
      
      const response = await makeRequest(options);
      
      state.serviceStatus[serviceName] = {
        status: response.statusCode === 200 ? 'Healthy' : 'Unhealthy',
        statusCode: response.statusCode,
        details: response.data
      };
      
      appendToReport(`### ${serviceName}\n`);
      appendToReport(`- **Status**: ${response.statusCode === 200 ? '✅ Healthy' : '❌ Unhealthy'}`);
      appendToReport(`- **Status Code**: ${response.statusCode}`);
      appendToReport(`- **Details**: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...\n`);
    } catch (error) {
      state.serviceStatus[serviceName] = {
        status: 'Error',
        error: error.message
      };
      
      appendToReport(`### ${serviceName}\n`);
      appendToReport(`- **Status**: ❌ Error`);
      appendToReport(`- **Error**: ${error.message}\n`);
    }
  }
}

// Get authentication token
async function authenticate() {
  try {
    const options = {
      hostname: config.auth.baseUrl,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const body = JSON.stringify(config.auth.credentials);
    
    const response = await makeRequest(options, body);
    
    if (response.statusCode === 200 && response.data.accessToken) {
      state.accessToken = response.data.accessToken;
      state.userId = response.data.user?.id;
      
      console.log('Authentication successful');
      return true;
    } else {
      console.log('Authentication failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    return false;
  }
}

// Analyze message schemas in code
function analyzeMessageSchemas() {
  appendToReport(`## Message Schema Analysis\n`);
  
  try {
    // Analyze BOE Parser output schema
    const boeParserOutput = analyzeCodeForSchema('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/boe-parser/src/utils/pubsub.js');
    state.messageSchemas.boeParserOutput = boeParserOutput;
    
    appendToReport(`### BOE Parser Output Schema\n`);
    appendToReport('```javascript\n' + boeParserOutput.schema + '\n```\n');
    
    // Analyze Notification Worker input schema
    const notificationWorkerInput = analyzeCodeForSchema('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/notification-worker/src/types/boe.js');
    state.messageSchemas.notificationWorkerInput = notificationWorkerInput;
    
    appendToReport(`### Notification Worker Input Schema\n`);
    appendToReport('```javascript\n' + notificationWorkerInput.schema + '\n```\n');
    
    // Compare schemas
    const schemaComparison = compareSchemas(boeParserOutput, notificationWorkerInput);
    state.schemaAnalysis = schemaComparison;
    
    appendToReport(`### Schema Comparison\n`);
    
    if (schemaComparison.structuralDiscrepancies.length === 0) {
      appendToReport(`✅ **No structural discrepancies found**\n`);
    } else {
      appendToReport(`❌ **Structural discrepancies found**\n`);
      appendToReport(`${schemaComparison.structuralDiscrepancies.length} issues identified:\n`);
      
      schemaComparison.structuralDiscrepancies.forEach((discrepancy, index) => {
        appendToReport(`${index + 1}. **${discrepancy.issue}**`);
        appendToReport(`   - BOE Parser: \`${discrepancy.boeParser}\``);
        appendToReport(`   - Notification Worker: \`${discrepancy.notificationWorker}\``);
        if (discrepancy.fix) {
          appendToReport(`   - Suggested fix: ${discrepancy.fix}`);
        }
        appendToReport('');
      });
    }
  } catch (error) {
    console.error('Error analyzing message schemas:', error);
    appendToReport(`### Error Analyzing Schemas\n`);
    appendToReport(`❌ **Error**: ${error.message}\n`);
  }
}

// Extract schema from code
function analyzeCodeForSchema(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let schema = '';
    
    // Different extraction methods based on file path
    if (filePath.includes('pubsub.js')) {
      // Extract message structure from pubsub.js
      const messageStructureMatch = fileContent.match(/const message = \{[\s\S]+?\};/g);
      if (messageStructureMatch) {
        schema = messageStructureMatch[0];
      }
    } else if (filePath.includes('types/boe.js')) {
      // Extract schema from Zod schema definition
      const schemaMatch = fileContent.match(/export const BOEMessageSchema = [\s\S]+?;/g);
      if (schemaMatch) {
        schema = schemaMatch[0];
      }
    }
    
    return {
      filePath,
      schema,
      hasResults: schema.includes('results'),
      hasMatches: schema.includes('matches')
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return {
      filePath,
      error: error.message,
      schema: null
    };
  }
}

// Compare schemas
function compareSchemas(boeParserSchema, notificationWorkerSchema) {
  const discrepancies = [];
  
  // Check for structural discrepancies between BOE Parser output and Notification Worker input
  if (boeParserSchema.schema.includes('results.results') && !boeParserSchema.schema.includes('results.matches')) {
    discrepancies.push({
      issue: 'Nested results structure in BOE Parser output',
      boeParser: 'results: { results: [...] }',
      notificationWorker: 'results: { matches: [...] }',
      fix: 'Update BOE Parser to use results.matches instead of results.results'
    });
  }
  
  if (boeParserSchema.schema.includes('matches: []') && !boeParserSchema.schema.includes('documents: []')) {
    discrepancies.push({
      issue: 'BOE Parser using matches array without documents',
      boeParser: 'matches: []',
      notificationWorker: 'documents: []',
      fix: 'Ensure BOE Parser includes documents array in matches'
    });
  }
  
  return {
    structuralDiscrepancies: discrepancies
  };
}

// Check PubSub configuration
function checkPubSubConfiguration() {
  appendToReport(`## PubSub Configuration\n`);
  
  try {
    // Extract PubSub configuration from both services
    const boeParserPubSub = extractPubSubConfig('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/boe-parser/src/utils/pubsub.js');
    const notificationWorkerPubSub = extractPubSubConfig('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/notification-worker/src/index.js');
    
    appendToReport(`### BOE Parser PubSub Configuration\n`);
    appendToReport(`- **Topic Name**: ${boeParserPubSub.topicName || 'Not found'}`);
    appendToReport(`- **DLQ Topic Name**: ${boeParserPubSub.dlqTopicName || 'Not found'}\n`);
    
    appendToReport(`### Notification Worker PubSub Configuration\n`);
    appendToReport(`- **Subscription Name**: ${notificationWorkerPubSub.subscriptionName || 'Not found'}`);
    appendToReport(`- **DLQ Topic Name**: ${notificationWorkerPubSub.dlqTopicName || 'Not found'}\n`);
    
    // Check for mismatches
    const pubsubIssues = [];
    
    if (boeParserPubSub.topicName && notificationWorkerPubSub.subscriptionName && 
        !notificationWorkerPubSub.subscriptionName.includes(boeParserPubSub.topicName)) {
      pubsubIssues.push('Topic name in BOE Parser does not match subscription name in Notification Worker');
    }
    
    if (boeParserPubSub.dlqTopicName !== notificationWorkerPubSub.dlqTopicName) {
      pubsubIssues.push('DLQ topic names do not match between services');
    }
    
    if (pubsubIssues.length > 0) {
      appendToReport(`### PubSub Configuration Issues\n`);
      pubsubIssues.forEach(issue => {
        appendToReport(`- ❌ **${issue}**\n`);
      });
    } else {
      appendToReport(`### PubSub Configuration Assessment\n`);
      appendToReport(`- ✅ **No configuration mismatches found**\n`);
    }
  } catch (error) {
    console.error('Error checking PubSub configuration:', error);
    appendToReport(`### Error Checking PubSub Configuration\n`);
    appendToReport(`❌ **Error**: ${error.message}\n`);
  }
}

// Extract PubSub configuration from code
function extractPubSubConfig(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const config = {};
    
    // Extract topic name
    const topicNameMatch = fileContent.match(/(?:PUBSUB_TOPIC_NAME|mainTopicName)\s*=\s*(?:process\.env\.PUBSUB_TOPIC_NAME\s*\|\|\s*['"]([^'"]+)['"]|['"]([^'"]+)['"])/);
    if (topicNameMatch) {
      config.topicName = topicNameMatch[1] || topicNameMatch[2];
    }
    
    // Extract DLQ topic name
    const dlqTopicNameMatch = fileContent.match(/(?:PUBSUB_DLQ_TOPIC_NAME|dlqTopicName|DLQ_TOPIC)\s*=\s*(?:process\.env\.(?:PUBSUB_DLQ_TOPIC_NAME|DLQ_TOPIC)\s*\|\|\s*['"]([^'"]+)['"]|['"]([^'"]+)['"])/);
    if (dlqTopicNameMatch) {
      config.dlqTopicName = dlqTopicNameMatch[1] || dlqTopicNameMatch[2];
    }
    
    // Extract subscription name
    const subscriptionNameMatch = fileContent.match(/(?:PUBSUB_SUBSCRIPTION)\s*=\s*(?:process\.env\.PUBSUB_SUBSCRIPTION\s*\|\|\s*['"]([^'"]+)['"]|['"]([^'"]+)['"])/);
    if (subscriptionNameMatch) {
      config.subscriptionName = subscriptionNameMatch[1] || subscriptionNameMatch[2];
    } else {
      // Try alternative pattern
      const subMatch = fileContent.match(/subscription\s*=\s*pubsub\.subscription\((?:process\.env\.PUBSUB_SUBSCRIPTION|['"]([^'"]+)['"])/);
      if (subMatch) {
        config.subscriptionName = subMatch[1] || 'From environment variable';
      }
    }
    
    return config;
  } catch (error) {
    console.error(`Error extracting PubSub config from ${filePath}:`, error);
    return {};
  }
}

// Analyze error logs
function analyzeErrorPattern() {
  appendToReport(`## Error Pattern Analysis\n`);
  
  const errorLog = `
2025-03-26T12:05:03.276Z ERROR: Failed to publish to DLQ {"error":{"code":5,"details":"Resource not found (resource=notification-dlq).","metadata":{},"note":"Exception occurred in retry method that was not classified as transient"},"original_error":{},"trace_id":"47e47250-00e0-4502-90ed-031e23dcc222"}
2025-03-26T12:05:04.259Z WARN: Message validation warning {"processor_type":"boe","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","errors":{"_errors":[],"results":{"_errors":[],"matches":{"_errors":["Required"]}}}}
2025-03-26T12:05:04.259Z WARN: Message validation warnings {"processor_type":"boe","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","errors":{"_errors":[],"results":{"_errors":[],"matches":{"_errors":["Required"]}}}}
2025-03-26T12:05:04.259Z INFO: Processing BOE message {"trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","subscription_id":"bbcde7bb-bc04-4a0b-8c47-01682a31cc15","user_id":"65c6074d-dbc4-4091-8e45-b6aecffd9ab9","match_count":0}
2025-03-26T12:05:04.259Z ERROR: Failed to process BOE message {"error":"Invalid message format: missing or invalid matches array","stack":"Error: Invalid message format: missing or invalid matches array\\n at processBOEMessage (file:///app/src/processors/boe.js:28:13)\\n at withRetry.maxRetries (file:///app/src/index.js:569:13)\\n at withRetry (file:///app/src/index.js:431:20)\\n at Subscription.processMessage (file:///app/src/index.js:568:11)\\n at process.processTicksAndRejections (node:internal/process/task_queues:95:5)","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","subscription_id":"bbcde7bb-bc04-4a0b-8c47-01682a31cc15","user_id":"65c6074d-dbc4-4091-8e45-b6aecffd9ab9"}`;
  
  appendToReport(`### Error Logs Sample\n`);
  appendToReport('```\n' + errorLog + '\n```\n');
  
  appendToReport(`### Error Analysis\n`);
  
  // Analyze errors
  appendToReport(`#### Primary Issues Identified\n`);
  appendToReport(`1. **Message Validation Error**: \`matches: { _errors: ["Required"] }\``);
  appendToReport(`   - The notification worker expects a \`matches\` array in the message structure`);
  appendToReport(`   - The incoming message doesn't have the expected \`matches\` array or it is not in the expected location\n`);
  
  appendToReport(`2. **Missing DLQ Resource**: \`Resource not found (resource=notification-dlq)\``);
  appendToReport(`   - The Dead Letter Queue (DLQ) topic \`notification-dlq\` does not exist`);
  appendToReport(`   - This prevents failed messages from being properly handled\n`);
  
  appendToReport(`3. **Processing Failure**: \`Invalid message format: missing or invalid matches array\``);
  appendToReport(`   - Error occurs in \`processBOEMessage\` at line 28 of \`processors/boe.js\``);
  appendToReport(`   - The message structure doesn't match what the processor expects\n`);
  
  appendToReport(`#### Root Cause Analysis\n`);
  appendToReport(`Based on the schema and error analysis, the root issues are:\n`);
  appendToReport(`1. **Schema Mismatch**: The BOE Parser is sending data in a structure different from what the Notification Worker expects`);
  appendToReport(`2. **Missing PubSub Resource**: The DLQ topic does not exist or is inaccessible`);
  appendToReport(`3. **Validation Error Handling**: The error handling doesn't recover from schema validation failures\n`);
}

// Generate recommended fixes
function generateRecommendations() {
  appendToReport(`## Recommended Fixes\n`);
  
  appendToReport(`### 1. Update Message Schema in BOE Parser\n`);
  appendToReport(`Update \`boe-parser/src/utils/pubsub.js\` to use the correct message structure:\n`);
  appendToReport('```javascript');
  appendToReport(`// Create the message structure that EXACTLY matches what the notification worker expects
const message = {
  // Required version field
  version: '1.0',
  trace_id: traceId,
  processor_type: 'boe',
  timestamp: new Date().toISOString(),
  
  // Request details with required fields
  request: {
    subscription_id: subscriptionId,
    user_id: userId,
    processing_id: randomUUID(),
    prompts: prompts
  },
  
  // Results section with required query_date and matches array
  results: {
    query_date: queryDate,
    matches: transformedMatches // Array of objects with prompt and documents
  },
  
  // Metadata with required fields
  metadata: {
    processing_time_ms: payload.metadata?.processing_time_ms || 0,
    total_items_processed: payload.metadata?.total_items_processed || 0,
    total_matches: matches.length,
    model_used: payload.metadata?.model_used || "gemini-2.0-pro-exp-02-05",
    status: payload.metadata?.status || 'success',
    error: null
  }
};`);
  appendToReport('```\n');
  
  appendToReport(`### 2. Create Missing DLQ Topic\n`);
  appendToReport(`Create the missing PubSub DLQ topic \`notification-dlq\` in Google Cloud:\n`);
  appendToReport('```bash');
  appendToReport(`# Using Google Cloud CLI
gcloud pubsub topics create notification-dlq --project=PROJECT_ID

# Verify topic exists
gcloud pubsub topics list --filter=name:notification-dlq`);
  appendToReport('```\n');
  
  appendToReport(`### 3. Improve Error Handling in Notification Worker\n`);
  appendToReport(`Update \`notification-worker/src/processors/boe.js\` to handle schema validation errors more gracefully:\n`);
  appendToReport('```javascript');
  appendToReport(`// Validate the message structure with fallbacks
if (!message.results?.matches || !Array.isArray(message.results.matches)) {
  // Try to recover by looking for matches in expected locations
  let matches = [];
  
  if (Array.isArray(message.results?.results?.[0]?.matches)) {
    // Handle legacy format where matches is nested under results.results[0]
    matches = message.results.results[0].matches;
    logger.warn('Found matches in legacy location: results.results[0].matches', {
      trace_id: message.trace_id,
      match_count: matches.length
    });
  } else if (message.results?.results) {
    // Try to extract matches from all results
    matches = message.results.results.flatMap(r => 
      Array.isArray(r.matches) ? r.matches.map(m => ({...m, prompt: r.prompt})) : []
    );
    logger.warn('Reconstructed matches from nested results structure', {
      trace_id: message.trace_id,
      match_count: matches.length
    });
  }
  
  if (matches.length > 0) {
    // Use the recovered matches
    message.results.matches = matches;
  } else {
    throw new Error('Invalid message format: missing or invalid matches array');
  }
}`);
  appendToReport('```\n');
  
  appendToReport(`### 4. Document Message Schema in a Shared Location\n`);
  appendToReport(`Create a comprehensive schema document at \`docs/pubsub-structure.md\` with:\n`);
  appendToReport(`- Complete JSON schema definition`);
  appendToReport(`- Example messages (successful and error cases)`);
  appendToReport(`- Implementation guidelines for all services`);
  appendToReport(`- Test utilities to validate schema conformance\n`);
  
  appendToReport(`### 5. Implement Monitoring and Alerting\n`);
  appendToReport(`Add monitoring for the notification pipeline:\n`);
  appendToReport(`- Track message validation errors in Cloud Monitoring`);
  appendToReport(`- Set up alerts for DLQ usage`);
  appendToReport(`- Create a dashboard for the notification pipeline`);
  appendToReport(`- Add custom metrics for schema version tracking\n`);
}

// Main function
async function analyzeNotificationPipeline() {
  console.log('Starting notification pipeline analysis...');
  
  // Step 1: Check service health
  console.log('Checking service health...');
  await checkServiceHealth();
  
  // Step 2: Authenticate (for later steps if needed)
  console.log('Authenticating...');
  await authenticate();
  
  // Step 3: Analyze message schemas
  console.log('Analyzing message schemas...');
  analyzeMessageSchemas();
  
  // Step 4: Check PubSub configuration
  console.log('Checking PubSub configuration...');
  checkPubSubConfiguration();
  
  // Step 5: Analyze error pattern
  console.log('Analyzing error patterns...');
  analyzeErrorPattern();
  
  // Step 6: Generate recommendations
  console.log('Generating recommendations...');
  generateRecommendations();
  
  console.log(`Analysis complete! Report saved to ${config.reportFile}`);
}

// Run the analysis
analyzeNotificationPipeline();