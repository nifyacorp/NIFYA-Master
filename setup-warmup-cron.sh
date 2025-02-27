#!/bin/bash
# Script to set up a Cloud Scheduler job that keeps notification-worker service warm

# Exit on error
set -e

# Variables (modify these as needed)
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1
JOB_NAME=notification-worker-warmup
CONFIG_FILE=notification-worker-scheduler.yaml

echo "Setting up warmup cron job for notification-worker..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Job name: $JOB_NAME"

# Check if the job already exists
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &>/dev/null; then
    echo "Updating existing cron job..."
    gcloud scheduler jobs update http $JOB_NAME \
        --location=$REGION \
        --config=$CONFIG_FILE
else
    echo "Creating new cron job..."
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --config=$CONFIG_FILE
fi

echo "Validating cron job..."
gcloud scheduler jobs describe $JOB_NAME --location=$REGION

echo "✅ Warmup cron job for notification-worker has been configured successfully."
echo "The service will be pinged every 4 minutes to keep it warm." 