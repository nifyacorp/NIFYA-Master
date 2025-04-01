/**
 * This script tests notification entity_type field to identify and fix the notification display issue
 */

const https = require('https');
const fs = require('fs');

// Get auth token and user ID from environment or files
let token;
let userId;

try {
  token = process.env.AUTH_TOKEN || fs.readFileSync('auth_token.txt', 'utf8').trim();
  userId = process.env.USER_ID || fs.readFileSync('user_id.txt', 'utf8').trim();
} catch (error) {
  // If files don't exist, prompt user to set environment variables
  console.error('Error reading auth files:', error.message);
  console.log('Please set AUTH_TOKEN and USER_ID environment variables or run auth-login.js');
  process.exit(1);
}

// Define request options
const options = {
  hostname: 'backend-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/v1/notifications',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-User-ID': userId
  }
};

console.log('Requesting notifications from:', options.path);

// Make the request
const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.error) {
        console.error('API returned error:', parsedData.error);
        process.exit(1);
      }

      if (!parsedData.notifications || !Array.isArray(parsedData.notifications)) {
        console.error('No notifications array in response:', parsedData);
        process.exit(1);
      }

      console.log(`Found ${parsedData.notifications.length} notifications`);

      const fullOutput = JSON.stringify(parsedData, null, 2);
      fs.writeFileSync('notification_analysis.json', fullOutput);
      console.log('Saved full output to notification_analysis.json');

      // Analyze the first notification in detail
      if (parsedData.notifications.length > 0) {
        const first = parsedData.notifications[0];
        console.log('\nAnalyzing first notification:');
        console.log('- ID:', first.id);
        console.log('- Title:', first.title);
        console.log('- Content sample:', first.content?.substring(0, 50) + '...');
        console.log('- entity_type:', first.entity_type);
        console.log('- Has metadata:', !!first.metadata);

        // Check entity_type format
        if (first.entity_type) {
          console.log('- entity_type format check:');
          console.log('  - type:', typeof first.entity_type);
          console.log('  - length:', first.entity_type.length);
          console.log('  - contains colon:', first.entity_type.includes(':'));

          // Debug entity_type character by character
          console.log('  - character dump:', Array.from(first.entity_type).map(c => `${c} (${c.charCodeAt(0)})`).join(', '));

          // Attempt to fix entity_type if it's not a proper string
          if (typeof first.entity_type !== 'string') {
            console.log('  ⚠️ entity_type is not a string!');
          } else if (!first.entity_type.includes(':')) {
            console.log('  ⚠️ entity_type does not contain the expected ":" delimiter!');
            console.log('  - Should follow format like "domain:type"');
          }
        } else {
          console.log('  ⚠️ entity_type is missing!');
        }

        // Examine metadata
        if (first.metadata) {
          console.log('\n- Metadata analysis:');
          console.log('  - type:', typeof first.metadata);

          if (typeof first.metadata === 'object') {
            console.log('  - keys:', Object.keys(first.metadata));

            // Look for possible entity type information in metadata
            const possibleEntityTypes = [
              'entity_type', 'entityType', 'type', 'source', 'document_type'
            ];

            for (const key of possibleEntityTypes) {
              if (first.metadata[key]) {
                console.log(`  - Potential entity_type found in metadata.${key}:`, first.metadata[key]);
              }
            }
          } else if (typeof first.metadata === 'string') {
            // Try to parse if it's a JSON string
            try {
              const parsedMetadata = JSON.parse(first.metadata);
              console.log('  - Parsed metadata keys:', Object.keys(parsedMetadata));
            } catch (e) {
              console.log('  - Could not parse metadata as JSON');
            }
          }
        }

        // Provide suggested fix
        console.log('\nProblem found:');
        if (!first.entity_type || typeof first.entity_type !== 'string' || !first.entity_type.includes(':')) {
          console.log('The entity_type field is missing, malformed, or not following the expected format.');
          console.log('This prevents proper parsing in the frontend, which expects the format "domain:type".');

          // Suggest fix based on what we know
          let suggestedFix = 'boe:document';
          if (first.metadata?.document_type) {
            suggestedFix = `boe:${first.metadata.document_type}`;
          }

          console.log('\nSuggested fix for notification-worker:');
          console.log('1. Ensure entity_type is set to a string in format "domain:type"');
          console.log(`2. For BOE notifications, set entity_type to "${suggestedFix}"`);
          console.log('3. Example code for notification-worker:');
          console.log('```javascript');
          console.log('// In notification creation function');
          console.log('const notification = {');
          console.log('  // other fields...');
          console.log('  entity_type: `${documentType}:${subType || "document"}`,');
          console.log('  // For BOE notifications specifically:');
          console.log('  // entity_type: "boe:document",');
          console.log('  // ...');
          console.log('};');
          console.log('```');
        }
      }

    } catch (error) {
      console.error('Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();