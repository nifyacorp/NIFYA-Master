/**
 * Debug Dashboard Component
 * 
 * A React component to visualize API requests, responses, and auth state
 * This should be imported and rendered only in development mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { getApiLogs, clearApiLogs, filterApiLogs, API_LOG_EVENT } from '../api-monitor/api-logger';

import './DebugDashboard.css';

/**
 * DebugDashboard Component
 * 
 * @param {Object} props
 * @param {boolean} [props.initiallyExpanded=false] - Whether the dashboard starts expanded
 * @param {string} [props.position='bottom-right'] - Position on screen: 'bottom-right', 'bottom-left', etc.
 * @param {Function} [props.getAuthState] - Function to get current auth state
 */
export const DebugDashboard = ({ 
  initiallyExpanded = false,
  position = 'bottom-right',
  getAuthState = () => ({ 
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    token: localStorage.getItem('accessToken'),
    userId: localStorage.getItem('userId')
  })
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [activeTab, setActiveTab] = useState('requests');
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    url: '',
    method: '',
    onlyErrors: false
  });
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    token: null,
    userId: null
  });
  
  // Refs
  const dashboardRef = useRef(null);
  
  // Apply logs from API logger on mount
  useEffect(() => {
    // Initialize with current logs
    setLogs(getApiLogs());
    
    // Update auth state
    setAuthState(getAuthState());
    
    // Listen for new logs
    const handleNewLog = (event) => {
      setLogs(getApiLogs());
    };
    
    // Listen for clear event
    const handleClearLogs = () => {
      setLogs([]);
      setSelectedLog(null);
    };
    
    // Set up event listeners
    window.addEventListener(API_LOG_EVENT, handleNewLog);
    window.addEventListener(`${API_LOG_EVENT}:clear`, handleClearLogs);
    
    // Poll for auth state changes
    const authInterval = setInterval(() => {
      setAuthState(getAuthState());
    }, 2000);
    
    // Clean up
    return () => {
      window.removeEventListener(API_LOG_EVENT, handleNewLog);
      window.removeEventListener(`${API_LOG_EVENT}:clear`, handleClearLogs);
      clearInterval(authInterval);
    };
  }, [getAuthState]);
  
  // Apply filters
  const filteredLogs = React.useMemo(() => {
    return filterApiLogs(filters);
  }, [logs, filters]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle clear logs
  const handleClearLogs = () => {
    clearApiLogs();
  };
  
  // Render minimized version
  if (!isExpanded) {
    return (
      <div className={`debug-dashboard-toggle ${position}`}>
        <button onClick={toggleExpanded}>
          🔍 Debug {logs.filter(log => log.isError).length > 0 && '(⚠️)'}
        </button>
      </div>
    );
  }
  
  // Render full dashboard
  return (
    <div ref={dashboardRef} className={`debug-dashboard ${position}`}>
      <div className="debug-dashboard-header">
        <h2>NIFYA API Debug Dashboard</h2>
        <div className="debug-dashboard-actions">
          <button onClick={handleClearLogs}>Clear</button>
          <button onClick={toggleExpanded}>Minimize</button>
        </div>
      </div>
      
      <div className="debug-dashboard-tabs">
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >
          Requests ({filteredLogs.length})
        </button>
        <button 
          className={activeTab === 'auth' ? 'active' : ''} 
          onClick={() => setActiveTab('auth')}
        >
          Auth
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      <div className="debug-dashboard-content">
        {activeTab === 'requests' && (
          <div className="requests-tab">
            <div className="filters">
              <input
                type="text"
                name="url"
                placeholder="Filter by URL"
                value={filters.url}
                onChange={handleFilterChange}
              />
              <select name="method" value={filters.method} onChange={handleFilterChange}>
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <label>
                <input 
                  type="checkbox" 
                  name="onlyErrors" 
                  checked={filters.onlyErrors} 
                  onChange={handleFilterChange} 
                />
                Only Errors
              </label>
            </div>
            
            <div className="logs-container">
              <div className="logs-list">
                {filteredLogs.length === 0 ? (
                  <div className="no-logs">No logs matching filters</div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`log-entry ${log.isError ? 'error' : ''} ${selectedLog?.id === log.id ? 'selected' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="log-method">{log.method}</div>
                      <div className="log-url" title={log.url}>
                        {log.url.length > 30 ? log.url.substring(0, 27) + '...' : log.url}
                      </div>
                      <div className="log-status">
                        {log.status || (log.isError ? '❌' : '...')}
                      </div>
                      <div className="log-time">
                        {log.duration ? `${log.duration.toFixed(0)}ms` : '...'}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {selectedLog && (
                <div className="log-details">
                  <h3>Request Details</h3>
                  <div className="detail-section">
                    <div className="detail-header">
                      <strong>{selectedLog.method}</strong> {selectedLog.url}
                    </div>
                    <div className="detail-status">
                      Status: {selectedLog.status || 'Pending'}
                      {selectedLog.isError && (
                        <span className="error-badge">Error</span>
                      )}
                    </div>
                    <div className="detail-time">
                      Time: {new Date(selectedLog.timestamp).toLocaleTimeString()}
                      {selectedLog.duration && (
                        <span className="duration-badge">{selectedLog.duration.toFixed(0)}ms</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Request Headers</h4>
                    <pre>{JSON.stringify(selectedLog.requestHeaders, null, 2)}</pre>
                  </div>
                  
                  {selectedLog.requestBody && (
                    <div className="detail-section">
                      <h4>Request Body</h4>
                      <pre>{JSON.stringify(selectedLog.requestBody, null, 2)}</pre>
                    </div>
                  )}
                  
                  {selectedLog.responseHeaders && (
                    <div className="detail-section">
                      <h4>Response Headers</h4>
                      <pre>{JSON.stringify(selectedLog.responseHeaders, null, 2)}</pre>
                    </div>
                  )}
                  
                  {selectedLog.responseBody && (
                    <div className="detail-section">
                      <h4>Response Body</h4>
                      <pre>{JSON.stringify(selectedLog.responseBody, null, 2)}</pre>
                    </div>
                  )}
                  
                  {selectedLog.errorMessage && (
                    <div className="detail-section error">
                      <h4>Error</h4>
                      <pre>{selectedLog.errorMessage}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'auth' && (
          <div className="auth-tab">
            <div className="auth-status">
              <h3>Authentication Status</h3>
              <div className="status-badge">
                {authState.isAuthenticated ? 'Authenticated ✓' : 'Not Authenticated ✗'}
              </div>
            </div>
            
            {authState.isAuthenticated && (
              <>
                <div className="auth-detail">
                  <strong>User ID:</strong> {authState.userId || 'Unknown'}
                </div>
                
                <div className="auth-detail">
                  <strong>Token:</strong>
                  <div className="token-display">
                    {authState.token 
                      ? `${authState.token.substring(0, 20)}...` 
                      : 'No token found'
                    }
                    <button 
                      onClick={() => navigator.clipboard.writeText(authState.token || '')}
                      disabled={!authState.token}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="auth-storage">
                  <h4>Local Storage Keys</h4>
                  <ul>
                    {Object.keys(localStorage)
                      .filter(key => key.includes('token') || key.includes('auth') || key.includes('user'))
                      .map(key => (
                        <li key={key}>
                          <strong>{key}:</strong> {
                            localStorage.getItem(key).length > 40
                              ? `${localStorage.getItem(key).substring(0, 37)}...`
                              : localStorage.getItem(key)
                          }
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}
            
            <div className="auth-actions">
              <button onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userId');
                setAuthState(getAuthState());
              }}>
                Clear Auth Data
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h3>Debug Settings</h3>
            
            <div className="setting-section">
              <h4>Position</h4>
              <select 
                value={position} 
                onChange={(e) => {
                  // This doesn't update state directly since position is a prop
                  // In a real implementation, this would need to be lifted up
                  console.log('Position would change to:', e.target.value);
                }}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            
            <div className="setting-section">
              <h4>Log Retention</h4>
              <p>Maximum logs stored: 100</p>
            </div>
            
            <div className="setting-section">
              <h4>Export/Import</h4>
              <button onClick={() => {
                const dataStr = JSON.stringify(logs);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `nifya-api-logs-${new Date().toISOString()}.json`;
                
                let linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}>
                Export Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugDashboard;