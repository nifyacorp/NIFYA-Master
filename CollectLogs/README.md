# NIFYA Service Logs

This directory contains consolidated log files from all NIFYA microservices.

## Log Collection Process

The `collect_all_logs.bat` script in this directory collects runtime logs from the following services:

- backend
- main-page
- subscription-worker
- notification-worker
- boe-parser

## Log File Structure

The script generates a single consolidated log file `consolidated_runtime_logs.log` that:

- Is overwritten each time the script runs (no historical log files are maintained)
- Contains the latest 200 log entries from each service
- Includes a unique UUID for each collection run
- Shows timestamps, severity levels, and full log messages
- Clearly separates logs from different services with header sections

## Running the Log Collection

To collect logs, run the following command from this directory:

```
.\collect_all_logs.bat
```

This will:
1. Generate a new UUID for the log collection
2. Create/overwrite the `consolidated_runtime_logs.log` file
3. Collect the latest 200 log entries from each service
4. Organize them in a single file with clear service boundaries

## Log Format

Each log entry includes:
- Timestamp
- Severity level (INFO, WARNING, ERROR, etc.)
- Full log message/payload

The consolidated log file is organized by service, making it easy to find logs from a specific component. 