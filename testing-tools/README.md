# NIFYA Testing Toolkit

A comprehensive suite of tools for testing the NIFYA platform, including backend API tests, frontend communication tests, and end-to-end test flows.

## Overview

This testing toolkit provides tools and scripts to help identify and diagnose issues in both the frontend and backend components of the NIFYA platform. It focuses on:

- **Backend API Testing**: Verify endpoints, authentication, and data operations
- **Frontend Communication**: Monitor and analyze API requests between frontend and backend
- **End-to-End Testing**: Test complete user flows from frontend to backend

## Directory Structure

```
testing-tools/
├── config/               # Configuration files
├── core/                 # Core utilities
│   ├── api-client.js     # API request client
│   └── logger.js         # Structured logging
├── docs/                 # Documentation
│   ├── TEST-GUIDE.md     # Comprehensive testing guide
│   └── backend-endpoints-reference.md # API endpoint reference
├── frontend-tests/       # Frontend testing tools
│   ├── api-monitor/      # API request monitoring tools
│   ├── mock-server/      # API proxy server
│   ├── network-validation/ # Request/response validation
│   └── ui-components/    # Debug UI components
├── outputs/              # Test outputs and logs
│   ├── comprehensive-tests/ # Full test run results
│   ├── frontend-logs/    # Frontend request logs
│   ├── logs/             # Detailed test logs
│   └── reports/          # Test reports and summaries
├── tests/                # Test scripts
│   ├── admin/            # Administrative tests
│   ├── auth/             # Authentication tests
│   ├── health/           # Health check tests
│   ├── notifications/    # Notification tests
│   ├── subscriptions/    # Subscription tests
│   └── user-journeys/    # End-to-end user flows
└── utils/                # Testing utilities
```

## Getting Started

### Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/yourusername/NIFYA-Master.git
cd NIFYA-Master/testing-tools

# Install dependencies
npm install
```

### Running Backend Tests

```bash
# Run all tests and generate a comprehensive report
node run-all-tests.js

# Run specific test
node tests/auth/login.js
```

### Using Frontend Testing Tools

```bash
# Start the API proxy server for frontend testing
cd frontend-tests
node mock-server/mock-api-server.js
```

For detailed instructions on using these tools, please see [Testing Guide](docs/TEST-GUIDE.md).

## Key Features

### Backend Testing

- **API Endpoint Tests**: Verify authentication, subscriptions, notifications, and diagnostics endpoints
- **Error Case Testing**: Test how the API handles invalid inputs and error conditions
- **Comprehensive Reports**: Detailed test results and analysis

### Frontend Testing

- **API Communication Monitoring**: Track and log all API requests and responses
- **Debug Dashboard**: Real-time visualization of API interactions
- **Request Validation**: Verify correct formatting of API requests from frontend

### End-to-End Testing

- **User Journey Tests**: Simulate complete user flows from login to using various features
- **Integration Verification**: Ensure frontend and backend work together correctly

## Documentation

- [Testing Guide](docs/TEST-GUIDE.md): Comprehensive guide to using all testing tools
- [Backend Endpoints Reference](docs/backend-endpoints-reference.md): Reference documentation for all backend API endpoints

## Contributing

When adding new tests or tools to this repository:

1. Follow the existing directory structure
2. Update the documentation to reflect your changes
3. Ensure all test outputs are properly structured and logged
4. Make sure your code follows the project's coding standards

## License

Copyright © 2025 NIFYA Team