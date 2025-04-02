# NIFYA Backend Testing Scripts (Legacy)

> **IMPORTANT:** These scripts have been migrated to the new `/testing-tools` directory. Please use the new structure for all testing and analysis.

## Migration Notice

This directory contains legacy testing scripts that have been reorganized into a more structured testing framework. The new framework is located in the `/testing-tools` directory.

### Key Improvements in New Structure

- **Organized Directory Structure**: Clear separation of tests by domain
- **Centralized Configuration**: All endpoints and test data in one place
- **Improved Logging**: Structured logging with timestamps and test context
- **Test Runner**: CLI tool for running test suites
- **Standardized Output**: Consistent output format for all tests
- **Better Documentation**: Comprehensive guides and findings

### Using the New Testing Tools

```bash
cd /testing-tools

# Run authentication tests
node tests/auth/login.js

# Run a user journey test
node tests/user-journeys/standard-flow.js

# Run all tests
node utils/test-runner.js all
```

For complete documentation, see `/testing-tools/docs/TESTING-GUIDE.md`.

## Legacy Scripts Reference

The scripts in this directory are kept for reference but should be considered deprecated.

For questions about the migration or using the new testing tools, refer to the documentation in the `/testing-tools` directory.