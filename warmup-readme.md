# Notification Worker Warmup Solution

This directory contains scripts and configuration to keep the Notification Worker service warm by periodically pinging its health endpoint.

## Background

Cloud Run services can experience cold starts when they haven't received traffic for a while. While Cloud Run offers a "minimum instances" setting, it may not always function as expected. This warmup solution ensures the service remains responsive by sending regular HTTP requests to the health endpoint.

## How It Works

1. A Cloud Scheduler job is configured to make an HTTP GET request to the Notification Worker's health endpoint every 4 minutes.
2. The health endpoint responds with a simple status check, keeping the service instance active.
3. Retry logic is built in to handle temporary unavailability.

## Files

- `notification-worker-scheduler.yaml`: Configuration file for the Cloud Scheduler job
- `setup-warmup-cron.sh`: Script to deploy/update the Cloud Scheduler job

## Setup Instructions

1. Make sure you have the Google Cloud SDK installed and configured.
2. Verify you have sufficient permissions to create/manage Cloud Scheduler jobs.
3. Run the setup script:

```bash
chmod +x setup-warmup-cron.sh
./setup-warmup-cron.sh
```

## Customization

You can modify the following parameters in the configuration files:

- **Schedule frequency**: Change the cron expression in `notification-worker-scheduler.yaml`
- **Target URL**: Update the URI if your health endpoint changes
- **Region/Project**: Modify the variables in the setup script

## Monitoring

You can monitor the execution of the warmup job using:

```bash
gcloud scheduler jobs list --location=us-central1
gcloud scheduler jobs get-execution-logs notification-worker-warmup --location=us-central1
```

## Troubleshooting

If the warmup job fails:

1. Verify the health endpoint is accessible
2. Check the service account permissions
3. Examine Cloud Scheduler execution logs
4. Verify the correct URL is being used

## Cleanup

To remove the warmup job:

```bash
gcloud scheduler jobs delete notification-worker-warmup --location=us-central1
``` 