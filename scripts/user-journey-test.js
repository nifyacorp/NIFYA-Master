/**
 * NIFYA User Journey Test Script
 * 
 * This script simulates the entire user journey from login to subscription processing
 * and notification checking by making API calls directly to the backend services.
 */

const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  auth: {
    baseUrl: 'authentication-service-415554190254.us-central1.run.app',
    credentials: {
      email: 'ratonxi@gmail.com',
      password: 'nifyaCorp12!'
    }
  },
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app'
  },
  subscription: {
    id: 'bbcde7bb-bc04-4a0b-8c47-01682a31cc15'
  },
  pollInterval: 5000, // ms
  maxPolls: 12,      // Maximum number of polling attempts
  outputDir: './',   // Directory to save response files
};

// Test state
const state = {
  accessToken: null,
  userId: null,
  subscriptionData: null,
  notifications: [],
  currentStep: 0,
  stepResults: {},
  errors: [],
  startTime: new Date(),
};

// Create a journey log file
const journeyLogFile = `${config.outputDir}user_journey_log.md`;
fs.writeFileSync(journeyLogFile, `# NIFYA User Journey Test\n\nStarted: ${state.startTime.toISOString()}\n\n`);

// Helper to append to journey log
function logJourneyStep(stepNumber, stepName, status, details = '') {
  const content = `\n## Step ${stepNumber}: ${stepName}\n\nStatus: ${status}\n\n${details}\n`;
  fs.appendFileSync(journeyLogFile, content);
  console.log(`Step ${stepNumber}: ${stepName} - ${status}`);
}

// Helper for making HTTP requests
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    // Log the request we're about to make
    console.log(`Making ${options.method} request to ${options.hostname}${options.path}`);
    
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
          
          // Save response to file
          const filename = `${config.outputDir}step${state.currentStep}_${options.method}_${options.path.replace(/\//g, '_')}.json`;
          fs.writeFileSync(filename, JSON.stringify(parsedData, null, 2));
          
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

// Step 1: Login and get auth token
async function login() {
  state.currentStep++;
  
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
      state.stepResults.login = {
        success: true,
        userId: state.userId,
        tokenReceived: true
      };
      
      logJourneyStep(state.currentStep, "Login", "✅ SUCCESS", 
        `- User ID: ${state.userId}\n- Token received: Yes\n- Response code: ${response.statusCode}`);
      
      return true;
    } else {
      state.stepResults.login = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.error || 'No token in response'
      };
      
      logJourneyStep(state.currentStep, "Login", "❌ FAILED", 
        `- Status code: ${response.statusCode}\n- Error: ${JSON.stringify(response.data.error || 'No token in response')}`);
      
      return false;
    }
  } catch (error) {
    state.errors.push({ step: 'login', error: error.message });
    state.stepResults.login = { success: false, error: error.message };
    
    logJourneyStep(state.currentStep, "Login", "❌ ERROR", 
      `- Error: ${error.message}`);
    
    return false;
  }
}

// Step 2: Get user profile
async function getUserProfile() {
  state.currentStep++;
  
  try {
    if (!state.accessToken) {
      throw new Error('No access token available');
    }
    
    const options = {
      hostname: config.auth.baseUrl,
      port: 443,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      state.stepResults.profile = {
        success: true,
        profile: response.data
      };
      
      logJourneyStep(state.currentStep, "Get User Profile", "✅ SUCCESS", 
        `- Email: ${response.data.email}\n- Name: ${response.data.name}\n- Response code: ${response.statusCode}`);
      
      return true;
    } else {
      state.stepResults.profile = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.error || 'Failed to get profile'
      };
      
      logJourneyStep(state.currentStep, "Get User Profile", "❌ FAILED", 
        `- Status code: ${response.statusCode}\n- Error: ${JSON.stringify(response.data.error || 'Failed to get profile')}`);
      
      return false;
    }
  } catch (error) {
    state.errors.push({ step: 'profile', error: error.message });
    state.stepResults.profile = { success: false, error: error.message };
    
    logJourneyStep(state.currentStep, "Get User Profile", "❌ ERROR", 
      `- Error: ${error.message}`);
    
    return false;
  }
}

// Step 3: List subscriptions
async function listSubscriptions() {
  state.currentStep++;
  
  try {
    if (!state.accessToken) {
      throw new Error('No access token available');
    }
    
    const options = {
      hostname: config.backend.baseUrl,
      port: 443,
      path: '/api/subscriptions',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const subscriptions = response.data.data?.subscriptions || response.data.subscriptions || [];
      
      // Check if our target subscription exists in the list
      const targetSubscription = subscriptions.find(s => s.id === config.subscription.id);
      
      if (targetSubscription) {
        state.subscriptionData = targetSubscription;
        state.stepResults.listSubscriptions = {
          success: true,
          subscriptionFound: true,
          subscriptionCount: subscriptions.length,
          targetSubscription
        };
        
        logJourneyStep(state.currentStep, "List Subscriptions", "✅ SUCCESS", 
          `- Subscriptions found: ${subscriptions.length}\n- Target subscription found: Yes\n- Subscription status: ${targetSubscription.status || 'N/A'}`);
      } else {
        state.stepResults.listSubscriptions = {
          success: true,
          subscriptionFound: false,
          subscriptionCount: subscriptions.length,
          error: `Target subscription ${config.subscription.id} not found`
        };
        
        logJourneyStep(state.currentStep, "List Subscriptions", "⚠️ WARNING", 
          `- Subscriptions found: ${subscriptions.length}\n- Target subscription found: No\n- Target ID: ${config.subscription.id}`);
      }
      
      return true;
    } else {
      state.stepResults.listSubscriptions = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.error || 'Failed to list subscriptions'
      };
      
      logJourneyStep(state.currentStep, "List Subscriptions", "❌ FAILED", 
        `- Status code: ${response.statusCode}\n- Error: ${JSON.stringify(response.data.error || 'Failed to list subscriptions')}`);
      
      return false;
    }
  } catch (error) {
    state.errors.push({ step: 'listSubscriptions', error: error.message });
    state.stepResults.listSubscriptions = { success: false, error: error.message };
    
    logJourneyStep(state.currentStep, "List Subscriptions", "❌ ERROR", 
      `- Error: ${error.message}`);
    
    return false;
  }
}

// Step 4: Process subscription
async function processSubscription() {
  state.currentStep++;
  
  try {
    if (!state.accessToken) {
      throw new Error('No access token available');
    }
    
    const options = {
      hostname: config.backend.baseUrl,
      port: 443,
      path: `/api/subscriptions/${config.subscription.id}/process`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      state.stepResults.processSubscription = {
        success: true,
        response: response.data
      };
      
      logJourneyStep(state.currentStep, "Process Subscription", "✅ SUCCESS", 
        `- Subscription ID: ${config.subscription.id}\n- Response code: ${response.statusCode}\n- Message: ${response.data.message || 'No message'}`);
      
      return true;
    } else {
      state.stepResults.processSubscription = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.error || 'Failed to process subscription'
      };
      
      logJourneyStep(state.currentStep, "Process Subscription", "❌ FAILED", 
        `- Status code: ${response.statusCode}\n- Error: ${JSON.stringify(response.data.error || 'Failed to process subscription')}`);
      
      return false;
    }
  } catch (error) {
    state.errors.push({ step: 'processSubscription', error: error.message });
    state.stepResults.processSubscription = { success: false, error: error.message };
    
    logJourneyStep(state.currentStep, "Process Subscription", "❌ ERROR", 
      `- Error: ${error.message}`);
    
    return false;
  }
}

// Step 5: Poll for notifications
async function pollForNotifications() {
  state.currentStep++;
  
  try {
    if (!state.accessToken) {
      throw new Error('No access token available');
    }
    
    let foundNotifications = false;
    let pollCount = 0;
    
    logJourneyStep(state.currentStep, "Poll for Notifications", "⏳ STARTED", 
      `- Will poll ${config.maxPolls} times with ${config.pollInterval/1000} second intervals`);
    
    // Polling loop
    while (pollCount < config.maxPolls) {
      pollCount++;
      
      console.log(`Polling for notifications (attempt ${pollCount}/${config.maxPolls})...`);
      
      const path = `/api/notifications?subscriptionId=${config.subscription.id}`;
      
      const options = {
        hostname: config.backend.baseUrl,
        port: 443,
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        const notifications = response.data.data?.notifications || response.data.notifications || [];
        
        if (notifications.length > 0) {
          state.notifications = notifications;
          state.stepResults.pollNotifications = {
            success: true,
            notificationsFound: true,
            count: notifications.length,
            notifications
          };
          
          foundNotifications = true;
          
          fs.appendFileSync(journeyLogFile, `\n### Polling attempt ${pollCount}: SUCCESS\n\n- Found ${notifications.length} notifications\n`);
          
          break;
        } else {
          fs.appendFileSync(journeyLogFile, `\n### Polling attempt ${pollCount}: No notifications yet\n`);
        }
      } else {
        fs.appendFileSync(journeyLogFile, `\n### Polling attempt ${pollCount}: ERROR\n\n- Status code: ${response.statusCode}\n- Error: ${JSON.stringify(response.data.error || 'Unknown error')}\n`);
      }
      
      // Wait before next poll
      if (pollCount < config.maxPolls) {
        await new Promise(resolve => setTimeout(resolve, config.pollInterval));
      }
    }
    
    if (foundNotifications) {
      logJourneyStep(state.currentStep, "Poll for Notifications", "✅ SUCCESS", 
        `- Notifications found: ${state.notifications.length}\n- Polling attempts: ${pollCount}/${config.maxPolls}`);
      
      return true;
    } else {
      state.stepResults.pollNotifications = {
        success: false,
        notificationsFound: false,
        error: 'No notifications found after maximum polling attempts'
      };
      
      logJourneyStep(state.currentStep, "Poll for Notifications", "⚠️ NO NOTIFICATIONS", 
        `- No notifications found after ${pollCount} polling attempts\n- This may indicate an issue in the notification pipeline`);
      
      return false;
    }
  } catch (error) {
    state.errors.push({ step: 'pollNotifications', error: error.message });
    state.stepResults.pollNotifications = { success: false, error: error.message };
    
    logJourneyStep(state.currentStep, "Poll for Notifications", "❌ ERROR", 
      `- Error: ${error.message}`);
    
    return false;
  }
}

// Run all steps in sequence
async function runUserJourney() {
  console.log('Starting NIFYA User Journey Test');
  console.log('---------------------------------');
  
  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed, cannot continue');
    }
    
    // Step 2: Get user profile
    await getUserProfile();
    
    // Step 3: List subscriptions
    await listSubscriptions();
    
    // Step 4: Process subscription
    await processSubscription();
    
    // Step 5: Poll for notifications
    await pollForNotifications();
    
    // Generate final summary
    const endTime = new Date();
    const duration = (endTime - state.startTime) / 1000; // in seconds
    
    const summary = `
## Journey Summary

- **Start time:** ${state.startTime.toISOString()}
- **End time:** ${endTime.toISOString()}
- **Duration:** ${duration.toFixed(2)} seconds
- **Steps completed:** ${state.currentStep}/5
- **Successful steps:** ${Object.values(state.stepResults).filter(r => r.success).length}
- **Failed steps:** ${Object.values(state.stepResults).filter(r => !r.success).length}
- **Errors encountered:** ${state.errors.length}

### Results by Step:
1. Login: ${state.stepResults.login?.success ? '✅ Success' : '❌ Failed'}
2. Get Profile: ${state.stepResults.profile?.success ? '✅ Success' : '❌ Failed'}
3. List Subscriptions: ${state.stepResults.listSubscriptions?.success ? '✅ Success' : '❌ Failed'}
4. Process Subscription: ${state.stepResults.processSubscription?.success ? '✅ Success' : '❌ Failed'}
5. Poll for Notifications: ${state.stepResults.pollNotifications?.success ? '✅ Success' : state.stepResults.pollNotifications?.notificationsFound === false ? '⚠️ No Notifications' : '❌ Failed'}

### Potential Issues:
${state.errors.length > 0 ? state.errors.map(e => `- ${e.step}: ${e.error}`).join('\n') : '- None detected'}
${!state.stepResults.listSubscriptions?.subscriptionFound ? `- Subscription ID ${config.subscription.id} not found` : ''}
${state.stepResults.pollNotifications?.notificationsFound === false ? '- No notifications detected after subscription processing' : ''}

### Next Steps:
${state.errors.length > 0 ? '- Fix the errors identified above' : '- Run more detailed tests for each component'}
${!state.stepResults.listSubscriptions?.subscriptionFound ? '- Verify the subscription ID' : ''}
${state.stepResults.pollNotifications?.notificationsFound === false ? '- Check notification worker logs for issues' : ''}
`;
    
    fs.appendFileSync(journeyLogFile, summary);
    
    console.log('\nUser journey test completed');
    console.log(`Results saved to: ${journeyLogFile}`);
    
    // Save full state to file
    fs.writeFileSync(`${config.outputDir}user_journey_state.json`, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`Failed to complete user journey: ${error.message}`);
    
    fs.appendFileSync(journeyLogFile, `\n## ERROR\n\nThe user journey test failed: ${error.message}\n`);
    
    // Save state even on error
    fs.writeFileSync(`${config.outputDir}user_journey_state.json`, JSON.stringify(state, null, 2));
  }
}

// Execute the user journey
runUserJourney();