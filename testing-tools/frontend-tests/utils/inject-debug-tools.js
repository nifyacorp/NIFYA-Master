/**
 * Debug Tools Injector for NIFYA Frontend
 * 
 * This script injects debugging tools into the frontend application without 
 * modifying the source code. It uses a proxy server to inject the scripts.
 */

const fs = require('fs');
const path = require('path');

/**
 * Debug tools script that will be injected into the frontend
 */
const debugToolsScript = `
/**
 * NIFYA Frontend API Debug Tools
 * 
 * This script is injected by the testing tools to provide real-time API debugging.
 * It doesn't use any mock data, instead observing real API communication.
 */
(function() {
  // Create a container for our logs
  const logs = [];
  const MAX_LOGS = 100;
  
  // Create a custom event for communication
  const NIFYA_API_LOG_EVENT = 'nifya:api-log';
  
  // Create a debug panel
  function createDebugPanel() {
    const panelExists = document.getElementById('nifya-debug-panel');
    if (panelExists) return;
    
    // Create panel container
    const panel = document.createElement('div');
    panel.id = 'nifya-debug-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '0';
    panel.style.right = '0';
    panel.style.width = '100%';
    panel.style.maxWidth = '800px';
    panel.style.height = '50%';
    panel.style.maxHeight = '400px';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #ccc';
    panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    panel.style.zIndex = '9999';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.transition = 'transform 0.3s ease';
    panel.style.transform = 'translateY(calc(100% - 30px))';
    
    // Create header
    const header = document.createElement('div');
    header.style.padding = '5px 10px';
    header.style.background = '#f5f5f5';
    header.style.borderBottom = '1px solid #ccc';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.cursor = 'pointer';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'NIFYA API Debug Monitor';
    title.style.fontWeight = 'bold';
    
    // Add controls
    const controls = document.createElement('div');
    
    // Add status indicator
    const status = document.createElement('span');
    status.id = 'nifya-debug-status';
    status.textContent = '●';
    status.style.color = '#4CAF50';
    status.style.marginRight = '10px';
    status.title = 'Monitoring active';
    
    // Add toggle button
    const toggle = document.createElement('span');
    toggle.textContent = 'Show';
    toggle.style.cursor = 'pointer';
    toggle.style.marginRight = '10px';
    
    // Add clear button
    const clear = document.createElement('span');
    clear.textContent = 'Clear';
    clear.style.cursor = 'pointer';
    
    // Add content area
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.overflow = 'auto';
    content.style.padding = '10px';
    
    // Add log container
    const logContainer = document.createElement('div');
    logContainer.id = 'nifya-debug-logs';
    
    // Assemble panel
    controls.appendChild(status);
    controls.appendChild(toggle);
    controls.appendChild(clear);
    header.appendChild(title);
    header.appendChild(controls);
    content.appendChild(logContainer);
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Add to document
    document.body.appendChild(panel);
    
    // Add event listeners
    let isPanelOpen = false;
    
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      isPanelOpen = !isPanelOpen;
      panel.style.transform = isPanelOpen 
        ? 'translateY(0)' 
        : 'translateY(calc(100% - 30px))';
      toggle.textContent = isPanelOpen ? 'Hide' : 'Show';
    });
    
    header.addEventListener('click', () => {
      isPanelOpen = !isPanelOpen;
      panel.style.transform = isPanelOpen 
        ? 'translateY(0)' 
        : 'translateY(calc(100% - 30px))';
      toggle.textContent = isPanelOpen ? 'Hide' : 'Show';
    });
    
    clear.addEventListener('click', (e) => {
      e.stopPropagation();
      logs.length = 0;
      updateLogDisplay();
    });
    
    // Initialize log display
    updateLogDisplay();
  }
  
  // Update the log display
  function updateLogDisplay() {
    const logContainer = document.getElementById('nifya-debug-logs');
    if (!logContainer) return;
    
    // Clear current logs
    logContainer.innerHTML = '';
    
    if (logs.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No API activity logged yet';
      emptyMessage.style.color = '#999';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '20px';
      logContainer.appendChild(emptyMessage);
      return;
    }
    
    // Add each log entry
    logs.forEach((log, index) => {
      const entry = document.createElement('div');
      entry.style.marginBottom = '8px';
      entry.style.padding = '8px';
      entry.style.borderRadius = '4px';
      entry.style.background = log.isError ? '#FFEBEE' : '#F5F5F5';
      entry.style.borderLeft = log.isError 
        ? '3px solid #F44336' 
        : '3px solid #2196F3';
      
      // Format timestamp
      const time = new Date(log.timestamp).toLocaleTimeString();
      
      // Create header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '5px';
      
      const method = document.createElement('span');
      method.textContent = log.method;
      method.style.fontWeight = 'bold';
      method.style.marginRight = '10px';
      
      const url = document.createElement('span');
      url.textContent = log.url;
      url.style.flex = '1';
      url.style.overflow = 'hidden';
      url.style.textOverflow = 'ellipsis';
      url.style.whiteSpace = 'nowrap';
      
      const timestamp = document.createElement('span');
      timestamp.textContent = time;
      timestamp.style.color = '#666';
      timestamp.style.marginLeft = '10px';
      
      header.appendChild(method);
      header.appendChild(url);
      header.appendChild(timestamp);
      
      // Create status line
      const status = document.createElement('div');
      status.style.display = 'flex';
      status.style.justifyContent = 'space-between';
      status.style.fontSize = '11px';
      status.style.color = '#666';
      
      const statusCode = document.createElement('span');
      statusCode.textContent = log.status ? \`Status: \${log.status}\` : 'Status: pending';
      
      const duration = document.createElement('span');
      duration.textContent = log.duration ? \`\${log.duration.toFixed(0)}ms\` : '';
      
      status.appendChild(statusCode);
      status.appendChild(duration);
      
      // Create toggle for details
      const toggle = document.createElement('div');
      toggle.textContent = 'Details ▼';
      toggle.style.cursor = 'pointer';
      toggle.style.fontSize = '11px';
      toggle.style.color = '#2196F3';
      toggle.style.marginTop = '5px';
      
      // Create details container (hidden by default)
      const details = document.createElement('div');
      details.style.display = 'none';
      details.style.marginTop = '8px';
      details.style.padding = '8px';
      details.style.background = '#fff';
      details.style.border = '1px solid #eee';
      details.style.borderRadius = '4px';
      details.style.fontSize = '11px';
      
      // Request details
      const requestHeader = document.createElement('div');
      requestHeader.textContent = 'Request';
      requestHeader.style.fontWeight = 'bold';
      requestHeader.style.marginBottom = '5px';
      
      const requestBody = document.createElement('pre');
      requestBody.textContent = log.requestBody 
        ? JSON.stringify(log.requestBody, null, 2) 
        : 'No request body';
      requestBody.style.margin = '0';
      requestBody.style.padding = '5px';
      requestBody.style.background = '#f9f9f9';
      requestBody.style.maxHeight = '100px';
      requestBody.style.overflow = 'auto';
      
      // Response details
      const responseHeader = document.createElement('div');
      responseHeader.textContent = 'Response';
      responseHeader.style.fontWeight = 'bold';
      responseHeader.style.marginTop = '10px';
      responseHeader.style.marginBottom = '5px';
      
      const responseBody = document.createElement('pre');
      responseBody.textContent = log.responseBody 
        ? JSON.stringify(log.responseBody, null, 2) 
        : 'No response yet';
      responseBody.style.margin = '0';
      responseBody.style.padding = '5px';
      responseBody.style.background = '#f9f9f9';
      responseBody.style.maxHeight = '100px';
      responseBody.style.overflow = 'auto';
      
      details.appendChild(requestHeader);
      details.appendChild(requestBody);
      details.appendChild(responseHeader);
      details.appendChild(responseBody);
      
      // Toggle details visibility
      toggle.addEventListener('click', () => {
        const isVisible = details.style.display !== 'none';
        details.style.display = isVisible ? 'none' : 'block';
        toggle.textContent = isVisible ? 'Details ▼' : 'Details ▲';
      });
      
      // Assemble entry
      entry.appendChild(header);
      entry.appendChild(status);
      entry.appendChild(toggle);
      entry.appendChild(details);
      
      logContainer.appendChild(entry);
    });
  }
  
  // Log an API request
  function logApiRequest(request) {
    const log = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      requestBody: request.body,
      status: null,
      responseBody: null,
      duration: null,
      isError: false
    };
    
    // Add to logs
    logs.unshift(log);
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
    
    // Emit event
    window.dispatchEvent(new CustomEvent(NIFYA_API_LOG_EVENT, {
      detail: { log, type: 'request' }
    }));
    
    // Update display
    updateLogDisplay();
    
    return log.id;
  }
  
  // Update a log with response
  function updateApiLog(id, response) {
    const index = logs.findIndex(log => log.id === id);
    if (index === -1) return;
    
    logs[index] = {
      ...logs[index],
      status: response.status,
      responseBody: response.body,
      duration: response.duration,
      isError: response.status >= 400
    };
    
    // Emit event
    window.dispatchEvent(new CustomEvent(NIFYA_API_LOG_EVENT, {
      detail: { log: logs[index], type: 'response' }
    }));
    
    // Update display
    updateLogDisplay();
  }
  
  // Intercept fetch requests
  function interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(resource, options = {}) {
      const startTime = performance.now();
      
      // Get URL from resource
      let url = typeof resource === 'string' ? resource : resource.url;
      
      // Only log API requests
      if (!url.includes('/api/')) {
        return originalFetch.apply(this, arguments);
      }
      
      // Parse request body if present
      let requestBody = null;
      if (options.body) {
        try {
          if (typeof options.body === 'string') {
            requestBody = JSON.parse(options.body);
          } else if (typeof options.body === 'object') {
            requestBody = options.body;
          }
        } catch (e) {
          requestBody = '[Unparseable body]';
        }
      }
      
      // Log request
      const logId = logApiRequest({
        method: options.method || 'GET',
        url,
        body: requestBody
      });
      
      try {
        // Make the actual request
        const response = await originalFetch.apply(this, arguments);
        const duration = performance.now() - startTime;
        
        // Clone the response so we can read the body
        const clonedResponse = response.clone();
        
        // Try to parse response body
        let responseBody = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseBody = await clonedResponse.json();
          } else {
            responseBody = await clonedResponse.text();
          }
        } catch (e) {
          responseBody = '[Error reading response]';
        }
        
        // Update log
        updateApiLog(logId, {
          status: response.status,
          body: responseBody,
          duration
        });
        
        return response;
      } catch (error) {
        // Handle network errors
        const duration = performance.now() - startTime;
        
        updateApiLog(logId, {
          status: 0,
          body: {
            error: error.message
          },
          duration
        });
        
        throw error;
      }
    };
  }
  
  // Intercept XMLHttpRequests
  function interceptXhr() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._nifyaUrl = url;
      this._nifyaMethod = method;
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      // Only log API requests
      if (!this._nifyaUrl || !this._nifyaUrl.includes('/api/')) {
        return originalSend.apply(this, arguments);
      }
      
      const startTime = performance.now();
      
      // Parse request body if present
      let requestBody = null;
      if (body) {
        try {
          if (typeof body === 'string') {
            requestBody = JSON.parse(body);
          } else if (typeof body === 'object') {
            requestBody = body;
          }
        } catch (e) {
          requestBody = '[Unparseable body]';
        }
      }
      
      // Log request
      const logId = logApiRequest({
        method: this._nifyaMethod,
        url: this._nifyaUrl,
        body: requestBody
      });
      
      // Track response
      this.addEventListener('load', function() {
        const duration = performance.now() - startTime;
        
        // Parse response body
        let responseBody = null;
        try {
          const contentType = this.getResponseHeader('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseBody = JSON.parse(this.responseText);
          } else {
            responseBody = this.responseText;
          }
        } catch (e) {
          responseBody = '[Error reading response]';
        }
        
        // Update log
        updateApiLog(logId, {
          status: this.status,
          body: responseBody,
          duration
        });
      });
      
      this.addEventListener('error', function() {
        const duration = performance.now() - startTime;
        
        // Update log
        updateApiLog(logId, {
          status: 0,
          body: {
            error: 'Network error'
          },
          duration
        });
      });
      
      return originalSend.apply(this, arguments);
    };
  }
  
  // Expose debug API globally
  window.NIFYA_DEBUG = {
    getLogs: () => [...logs],
    clearLogs: () => {
      logs.length = 0;
      updateLogDisplay();
    }
  };
  
  // Initialize when DOM is ready
  function init() {
    console.log('NIFYA API Debug Tools initializing...');
    
    // Create debug panel
    createDebugPanel();
    
    // Intercept requests
    interceptFetch();
    interceptXhr();
    
    console.log('NIFYA API Debug Tools initialized!');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

/**
 * Create the HTML content with injected debugging tools
 */
function createDebugHtml(htmlContent) {
  // Find the closing </body> tag
  const bodyCloseIndex = htmlContent.indexOf('</body>');
  
  if (bodyCloseIndex === -1) {
    // If no closing body tag, just append at the end
    return htmlContent + `<script>${debugToolsScript}</script>`;
  }
  
  // Insert the script before the closing body tag
  return (
    htmlContent.substring(0, bodyCloseIndex) +
    `<script>${debugToolsScript}</script>` +
    htmlContent.substring(bodyCloseIndex)
  );
}

/**
 * Create a proxy server HTML content handler that injects debugging tools
 */
function createProxyHtmlHandler() {
  return (req, res, next) => {
    const originalSend = res.send;
    
    // Override the send method
    res.send = function(body) {
      // Only process HTML responses
      const contentType = res.get('Content-Type');
      if (contentType && contentType.includes('text/html') && typeof body === 'string') {
        // Inject debug tools
        body = createDebugHtml(body);
      }
      
      // Call the original send method
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Apply debug tools to a standalone HTML file
 */
function injectDebugToolsToFile(filePath, outputPath) {
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const modifiedHtml = createDebugHtml(htmlContent);
    
    fs.writeFileSync(outputPath || filePath, modifiedHtml);
    return true;
  } catch (err) {
    console.error('Error injecting debug tools:', err);
    return false;
  }
}

module.exports = {
  createDebugHtml,
  createProxyHtmlHandler,
  injectDebugToolsToFile,
  debugToolsScript
};