/**
 * NIFYA Backend Endpoint Mapping
 * 
 * This script analyzes all backend services to discover and document available API endpoints.
 * It creates a comprehensive map of endpoints that can be compared against frontend needs.
 */

const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const path = require('path');

// Configuration
const config = {
  services: [
    {
      name: 'Authentication Service',
      baseUrl: 'authentication-service-415554190254.us-central1.run.app',
      explorerPath: '/api/explorer',
      localPath: '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/Authentication-Service'
    },
    {
      name: 'Backend API',
      baseUrl: 'backend-415554190254.us-central1.run.app',
      explorerPath: '/api/explorer',
      localPath: '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/backend'
    },
    {
      name: 'Subscription Worker',
      baseUrl: 'subscription-worker-415554190254.us-central1.run.app',
      explorerPath: '/api/explorer',
      localPath: '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/subscription-worker'
    },
    {
      name: 'Notification Worker',
      baseUrl: 'notification-worker-415554190254.us-central1.run.app',
      explorerPath: '/api/explorer',
      localPath: '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/notification-worker'
    },
    {
      name: 'BOE Parser',
      baseUrl: 'boe-parser-415554190254.us-central1.run.app',
      explorerPath: '/api/explorer',
      localPath: '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/boe-parser'
    }
  ],
  outputFile: 'backend_endpoints_map.md',
  frontendAnalysisOutput: 'frontend_endpoints_used.md'
};

// Endpoints discovered
const discoveredEndpoints = [];

// Helper for making HTTP requests
function makeRequest(options) {
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
            // If not JSON, just return the raw data
            parsedData = { raw: data.substring(0, 500) + (data.length > 500 ? '...' : '') };
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
    
    req.end();
  });
}

// Get endpoints from API explorer
async function getEndpointsFromExplorer(service) {
  try {
    const options = {
      hostname: service.baseUrl,
      port: 443,
      path: service.explorerPath,
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.data.endpoints) {
      return {
        success: true,
        endpoints: response.data.endpoints.map(endpoint => ({
          path: endpoint.path,
          methods: endpoint.methods,
          description: endpoint.description,
          source: 'api-explorer'
        }))
      };
    } else {
      return {
        success: false,
        error: `API explorer returned status ${response.statusCode}`
      };
    }
  } catch (error) {
    console.log(`Could not get endpoints from explorer for ${service.name}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Search for endpoints in code
function findEndpointsInCode(service) {
  return new Promise((resolve) => {
    const endpoints = [];
    const routesDir = path.join(service.localPath, 'routes');
    
    // Check if routes directory exists
    if (!fs.existsSync(routesDir)) {
      console.log(`Routes directory not found for ${service.name}`);
      resolve({
        success: false,
        error: 'Routes directory not found'
      });
      return;
    }
    
    // Use grep to find router definitions in routes directory
    exec(`grep -r "router\\.(get\\|post\\|put\\|delete)" ${service.localPath}`, (error, stdout, stderr) => {
      if (error && error.code !== 1) { // grep returns 1 if no matches
        console.error(`Error searching for routes: ${error.message}`);
        resolve({
          success: false,
          error: error.message
        });
        return;
      }
      
      // Parse grep results to extract endpoints
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Simple regex to extract route patterns
        const routeMatch = line.match(/router\.(get|post|put|delete)\s*\(\s*['"](.*?)['"],?/);
        if (routeMatch) {
          const method = routeMatch[1].toUpperCase();
          const path = routeMatch[2];
          
          endpoints.push({
            path,
            methods: [method],
            description: `(Found in code)`,
            source: 'code-analysis',
            filePath: line.split(':')[0]
          });
        }
      }
      
      resolve({
        success: true,
        endpoints
      });
    });
  });
}

// Analyze frontend code for API calls
function analyzeFrontendForEndpoints() {
  return new Promise((resolve) => {
    const frontendDir = '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/frontend';
    const endpoints = [];
    
    // Patterns to search for API calls in frontend code
    const patterns = [
      'fetch\\(.*?[\'"]\\/(api\\/[^\'"]+)[\'"]', // fetch('/api/something')
      'axios\\.(get|post|put|delete)\\([\'"]\\/(api\\/[^\'"]+)[\'"]', // axios.get('/api/something')
      'url:\\s*[\'"]\\/(api\\/[^\'"]+)[\'"]', // url: '/api/something'
      '\\.request\\(.*?[\'"]\\/(api\\/[^\'"]+)[\'"]' // .request('/api/something')
    ];
    
    // Run grep for each pattern
    const searchPromises = patterns.map(pattern => {
      return new Promise((resolveSearch) => {
        exec(`grep -r "${pattern}" ${frontendDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`, 
          (error, stdout, stderr) => {
            if (error && error.code !== 1) {
              console.error(`Error searching frontend: ${error.message}`);
              resolveSearch([]);
              return;
            }
            
            const lines = stdout.split('\n');
            const foundEndpoints = [];
            
            for (const line of lines) {
              if (!line.trim()) continue;
              
              // Extract the endpoint path
              const parts = line.split(':');
              const filePath = parts[0];
              const lineContent = parts.slice(1).join(':');
              
              // Extract API paths with regex
              const apiMatch = lineContent.match(/\/api\/[a-zA-Z0-9\/_-]+/g);
              if (apiMatch) {
                for (const path of apiMatch) {
                  // Clean up the path (remove query params, etc)
                  const cleanPath = path.split('?')[0].split('${')[0].replace(/["']/g, '');
                  
                  // Try to determine HTTP method from context
                  let method = 'UNKNOWN';
                  if (lineContent.includes('.get(') || lineContent.includes('method: "GET"') || lineContent.includes("method: 'GET'")) {
                    method = 'GET';
                  } else if (lineContent.includes('.post(') || lineContent.includes('method: "POST"') || lineContent.includes("method: 'POST'")) {
                    method = 'POST';
                  } else if (lineContent.includes('.put(') || lineContent.includes('method: "PUT"') || lineContent.includes("method: 'PUT'")) {
                    method = 'PUT';
                  } else if (lineContent.includes('.delete(') || lineContent.includes('method: "DELETE"') || lineContent.includes("method: 'DELETE'")) {
                    method = 'DELETE';
                  }
                  
                  foundEndpoints.push({
                    path: cleanPath,
                    method,
                    filePath,
                    lineContent: lineContent.trim()
                  });
                }
              }
            }
            
            resolveSearch(foundEndpoints);
          });
      });
    });
    
    Promise.all(searchPromises)
      .then(results => {
        // Flatten and deduplicate results
        const allEndpoints = results.flat();
        const uniqueEndpoints = [];
        
        // Group by path
        const endpointMap = {};
        for (const endpoint of allEndpoints) {
          if (!endpointMap[endpoint.path]) {
            endpointMap[endpoint.path] = {
              path: endpoint.path,
              methods: new Set(),
              files: new Set()
            };
          }
          endpointMap[endpoint.path].methods.add(endpoint.method);
          endpointMap[endpoint.path].files.add(endpoint.filePath);
        }
        
        // Convert to array
        for (const key in endpointMap) {
          uniqueEndpoints.push({
            path: key,
            methods: Array.from(endpointMap[key].methods),
            files: Array.from(endpointMap[key].files),
            source: 'frontend-analysis'
          });
        }
        
        // Write results to file
        const frontendAnalysis = `# Frontend API Endpoint Usage

This document lists all API endpoints referenced in the frontend code.

## Endpoints Found: ${uniqueEndpoints.length}

| Endpoint | Methods | Files |
|----------|---------|-------|
${uniqueEndpoints.map(e => 
  `| \`${e.path}\` | ${e.methods.join(', ')} | ${e.files.length} files |`
).join('\n')}

## Detailed Listing

${uniqueEndpoints.map(e => 
  `### \`${e.path}\`

- **Methods:** ${e.methods.join(', ')}
- **Referenced in:**
${e.files.map(file => `  - \`${file.replace('/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/frontend/', '')}\``).join('\n')}
`).join('\n')}
`;
        
        fs.writeFileSync(config.frontendAnalysisOutput, frontendAnalysis);
        console.log(`Frontend endpoint analysis saved to ${config.frontendAnalysisOutput}`);
        
        resolve(uniqueEndpoints);
      })
      .catch(error => {
        console.error(`Error analyzing frontend: ${error.message}`);
        resolve([]);
      });
  });
}

// Main function
async function mapAllEndpoints() {
  console.log('Starting backend endpoint mapping...');
  
  // Collect endpoints from each service
  for (const service of config.services) {
    console.log(`\nAnalyzing ${service.name}...`);
    
    // Try API explorer first
    const explorerResults = await getEndpointsFromExplorer(service);
    if (explorerResults.success) {
      console.log(`Found ${explorerResults.endpoints.length} endpoints from API explorer`);
      
      explorerResults.endpoints.forEach(endpoint => {
        discoveredEndpoints.push({
          service: service.name,
          ...endpoint
        });
      });
    } else {
      console.log(`API explorer not available: ${explorerResults.error}`);
    }
    
    // Find endpoints in code as backup/complement
    const codeResults = await findEndpointsInCode(service);
    if (codeResults.success) {
      console.log(`Found ${codeResults.endpoints.length} endpoints from code analysis`);
      
      codeResults.endpoints.forEach(endpoint => {
        discoveredEndpoints.push({
          service: service.name,
          ...endpoint
        });
      });
    } else {
      console.log(`Code analysis failed: ${codeResults.error}`);
    }
  }
  
  // Analyze frontend code
  console.log('\nAnalyzing frontend code for API usage...');
  const frontendEndpoints = await analyzeFrontendForEndpoints();
  console.log(`Found ${frontendEndpoints.length} endpoints referenced in frontend code`);
  
  // Compare frontend endpoints with backend endpoints
  const comparisonResults = compareEndpoints(discoveredEndpoints, frontendEndpoints);
  
  // Generate comprehensive report
  generateReport(discoveredEndpoints, frontendEndpoints, comparisonResults);
  
  console.log(`\nEndpoint mapping completed! Results saved to ${config.outputFile}`);
}

// Compare frontend and backend endpoints
function compareEndpoints(backendEndpoints, frontendEndpoints) {
  const results = {
    matched: [],
    missingInBackend: [],
    unusedInBackend: []
  };
  
  // Find matches
  for (const frontendEndpoint of frontendEndpoints) {
    const matchingBackendEndpoints = backendEndpoints.filter(be => {
      // Handle wildcards and path params
      const fePathPattern = frontendEndpoint.path
        .replace(/\/:[^\/]+/g, '/[^/]+') // Convert Express params to regex
        .replace(/\//g, '\\/'); // Escape slashes
      
      const regex = new RegExp(`^${fePathPattern}$`);
      return regex.test(be.path);
    });
    
    if (matchingBackendEndpoints.length > 0) {
      results.matched.push({
        frontend: frontendEndpoint,
        backend: matchingBackendEndpoints
      });
    } else {
      results.missingInBackend.push(frontendEndpoint);
    }
  }
  
  // Find unused backend endpoints
  for (const backendEndpoint of backendEndpoints) {
    const isUsed = results.matched.some(match => 
      match.backend.some(be => be.path === backendEndpoint.path)
    );
    
    if (!isUsed) {
      results.unusedInBackend.push(backendEndpoint);
    }
  }
  
  return results;
}

// Generate comprehensive report
function generateReport(backendEndpoints, frontendEndpoints, comparison) {
  // Group backend endpoints by service
  const endpointsByService = {};
  for (const endpoint of backendEndpoints) {
    if (!endpointsByService[endpoint.service]) {
      endpointsByService[endpoint.service] = [];
    }
    endpointsByService[endpoint.service].push(endpoint);
  }
  
  // Create the report content
  let report = `# NIFYA Backend API Endpoint Map

This document provides a comprehensive map of all backend endpoints across NIFYA services.

## Summary

- **Total endpoints discovered:** ${backendEndpoints.length}
- **Unique endpoints:** ${new Set(backendEndpoints.map(e => e.path)).size}
- **Frontend endpoints referenced:** ${frontendEndpoints.length}
- **Endpoints matched between frontend and backend:** ${comparison.matched.length}
- **Endpoints missing in backend:** ${comparison.missingInBackend.length}
- **Unused backend endpoints:** ${comparison.unusedInBackend.length}

## Endpoints by Service

`;

  // Add endpoints by service
  for (const [service, endpoints] of Object.entries(endpointsByService)) {
    const uniquePaths = new Set(endpoints.map(e => e.path));
    
    report += `### ${service}

**Endpoints:** ${uniquePaths.size}

| Endpoint | Methods | Description | Source |
|----------|---------|-------------|--------|
`;
    
    // Group by path
    const endpointsByPath = {};
    for (const endpoint of endpoints) {
      if (!endpointsByPath[endpoint.path]) {
        endpointsByPath[endpoint.path] = {
          path: endpoint.path,
          methods: new Set(),
          description: endpoint.description,
          source: endpoint.source
        };
      }
      
      endpoint.methods.forEach(m => endpointsByPath[endpoint.path].methods.add(m));
    }
    
    // Sort by path
    const sortedPaths = Object.values(endpointsByPath).sort((a, b) => a.path.localeCompare(b.path));
    
    for (const endpoint of sortedPaths) {
      report += `| \`${endpoint.path}\` | ${Array.from(endpoint.methods).join(', ')} | ${endpoint.description || 'N/A'} | ${endpoint.source} |\n`;
    }
    
    report += '\n';
  }
  
  // Add frontend-backend comparison
  report += `## Frontend-Backend Comparison

### Missing Endpoints (Referenced in Frontend but not found in Backend)

${comparison.missingInBackend.length === 0 ? 'No missing endpoints! 🎉' : ''}
${comparison.missingInBackend.map(e => `- \`${e.methods.join(', ')} ${e.path}\` (Referenced in ${e.files.length} files)`).join('\n')}

### Unused Backend Endpoints

${comparison.unusedInBackend.length === 0 ? 'All backend endpoints are used! 🎉' : ''}
${comparison.unusedInBackend.map(e => `- \`${e.methods.join(', ')} ${e.path}\` (${e.service})`).join('\n')}

## Potential Issues

${comparison.missingInBackend.length > 0 ? 
  '- Frontend is referencing endpoints that don\'t exist in the backend' : ''}
${comparison.unusedInBackend.length > 0 ? 
  '- Some backend endpoints are not being used by the frontend' : ''}
${comparison.missingInBackend.length === 0 && comparison.unusedInBackend.length === 0 ? 
  '- No issues detected! Frontend and backend endpoints are aligned.' : ''}

## Next Steps

${comparison.missingInBackend.length > 0 ? 
  '- Implement the missing endpoints in the backend or update frontend references' : ''}
${comparison.unusedInBackend.length > 0 ? 
  '- Review unused endpoints to determine if they should be removed or documented' : ''}
${comparison.missingInBackend.length === 0 && comparison.unusedInBackend.length === 0 ? 
  '- Continue monitoring as new features are developed' : ''}

`;

  // Save the report
  fs.writeFileSync(config.outputFile, report);
}

// Run the mapping
mapAllEndpoints();