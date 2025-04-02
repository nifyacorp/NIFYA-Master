# NIFYA Frontend Testing Platform

This testing platform is designed to validate frontend-to-backend API communication in the NIFYA application. Unlike traditional testing approaches, this platform focuses on real API interactions rather than UI testing.

## Features

- **API Request Monitoring**: Capture and analyze all API requests between frontend and backend
- **Proxy Server**: Transparent proxy that logs all requests/responses while communicating with the real backend
- **Debug Dashboard**: In-browser tool to monitor API calls in real-time
- **Network Validation**: Automated analysis to detect common API issues
- **Detailed Reports**: HTML reports that highlight communication problems

## Key Advantages

1. **Tests Real API Interactions**: Uses the actual backend API, not mocks
2. **Minimal Setup**: No need to modify frontend code
3. **Comprehensive Logging**: Captures all request/response details
4. **Detailed Analysis**: Identifies common issues like auth problems, CORS, and more
5. **Works with Existing Backend Tests**: Complements the backend test suite

## Installation

```bash
# Navigate to the frontend testing directory
cd /mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/frontend-tests

# Install dependencies
npm install
```

## Usage

### Start API Proxy Server with Debug Tools

This starts the proxy server that logs all API calls:

```bash
npm start
```

Options:
- `--port <port>` - Specify port (default: 3030)
- `--backend <url>` - Backend API URL
- `--auth <url>` - Auth Service URL
- `--open` - Open browser automatically
- `--debug` - Show detailed debug information

### Open with Browser

Start the proxy and automatically open in your browser:

```bash
npm run monitor
```

### Run Analysis on Existing Logs

Analyze previously captured logs without starting the server:

```bash
npm run analyze
```

## How to Test Frontend Communication

1. **Start the Proxy Server**:
   ```bash
   npm start --open
   ```

2. **Use the Application**:
   - Navigate to http://localhost:3030
   - The proxy will automatically forward requests to the real backend
   - Use the application as normal, performing the scenarios you want to test

3. **Monitor API Calls**:
   - Use the debug panel at the bottom of the screen to see API activity
   - Click on requests to see detailed request/response information

4. **Analyze Results**:
   - Press Ctrl+C to stop the server when finished
   - The tool will automatically analyze logs and generate a report
   - The report will be saved in the `../outputs/frontend-test-results` directory

## Directory Structure

- **api-monitor/**: Tools for intercepting and logging API requests
- **mock-server/**: Proxy server that forwards requests to the real backend
- **network-validation/**: Tools for analyzing API communication issues
- **ui-components/**: React components for the debug dashboard
- **utils/**: Helper utilities
- **tests/**: Main test runner script

## API Debug Dashboard

The API Debug Dashboard is automatically injected into the frontend application when accessed through the proxy. It provides:

- Real-time display of API requests and responses
- Detailed view of request/response bodies
- HTTP status codes and timing information
- Authentication state monitoring

## Network Analysis

The network analyzer checks for common issues:

- **Authentication Problems**: Failed login attempts, token issues
- **API Endpoint Issues**: High error rates, performance problems
- **Header Issues**: Missing or malformed headers
- **CORS Problems**: Cross-origin request issues

## Integration with Backend Tests

The frontend testing platform complements the existing backend tests by:

1. Validating the same endpoints from the client perspective
2. Using the same authentication flow
3. Detecting client-side issues that backend tests can't find
4. Providing an end-to-end view of the API communication