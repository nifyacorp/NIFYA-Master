# Create Cloud Scheduler job for subscription processing
# Run on weekdays at 9 AM Madrid time

$jobName = "subscription-daily-processor"
$schedule = "0 9 * * 1-5"
$timeZone = "Europe/Madrid"
$uri = "https://subscription-worker-415554190254.us-central1.run.app/api/subscriptions/process-all"
$method = "POST"
$body = '{"source": "cloud-scheduler", "working_day": true}'
$description = "Process all subscriptions on working days (Monday-Friday)"
$location = "us-central1" # Match with the Cloud Run app location

# Run the gcloud command
Write-Host "Creating Cloud Scheduler job: $jobName in $location..."
gcloud scheduler jobs create http $jobName `
  --location="$location" `
  --schedule="$schedule" `
  --uri="$uri" `
  --http-method=$method `
  --headers="Content-Type=application/json" `
  --message-body="$body" `
  --description="$description" `
  --time-zone="$timeZone"

Write-Host "Job created successfully." 