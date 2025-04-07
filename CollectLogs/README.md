# NIFYA Service Logs

This directory contains consolidated log files from all NIFYA microservices.

## Log Collection Process

The `collect_logs.ps1` PowerShell script in this directory collects runtime logs from the following services:

- backend
- authentication-service
- boe-parser
- doga-parser
- email-notification
- subscription-worker
- notification-worker
- logendpoint

## Log File Structure

The script generates a single consolidated log file `consolidated_runtime_logs.log` that:

- Is overwritten each time the script runs (no historical log files are maintained)
- Contains the latest 200 log entries from each service
- Includes a unique UUID for each collection run
- Shows timestamps and full log messages
- Clearly separates logs from different services with header sections

## Running the Log Collection

To collect logs, run the following PowerShell command:

```
powershell -ExecutionPolicy Bypass -File CollectLogs/collect_logs.ps1
```

This will:
1. Generate a new UUID for the log collection
2. Create/overwrite the `consolidated_runtime_logs.log` file
3. Collect the latest 200 log entries from each service
4. Organize them in a single file with clear service boundaries
5. Automatically open the CollectLogs folder when complete

## Log Format

Each log entry includes:
- Timestamp in ISO format
- Full log message/payload 

The consolidated log file is organized by service, making it easy to find logs from a specific component.

## Troubleshooting

If you encounter any issues with the script:

1. Ensure you have the Google Cloud SDK installed
2. Verify you have the necessary permissions to access logs
3. Check that you're connected to the correct GCP project (delta-entity-447812-p2) 