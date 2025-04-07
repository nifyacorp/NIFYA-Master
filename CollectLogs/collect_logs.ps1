# Collect logs for all NIFYA services
Write-Host "Collecting runtime logs for all NIFYA services..."

# Set the project ID
Write-Host "Setting GCP project..."
& gcloud config set project delta-entity-447812-p2

# Create a UUID for this log collection
$logUuid = [guid]::NewGuid().ToString()
Write-Host "Log UUID: $logUuid"

# Define output file path
$outputPath = "CollectLogs\consolidated_runtime_logs.log"
Write-Host "Output will be saved to: $outputPath"

# Create the file with headers
Set-Content -Path $outputPath -Value @"
------------------------------------------------------
NIFYA Consolidated Runtime Logs - Version ID: $logUuid
Collected on: $(Get-Date)
------------------------------------------------------

"@

# Define all services to collect logs from
$services = @(
    "backend",
    "authentication-service", 
    "boe-parser", 
    "doga-parser", 
    "email-notification", 
    "subscription-worker", 
    "notification-worker", 
    "logendpoint"
)

# Loop through services and collect logs
foreach ($service in $services) {
    Write-Host "Collecting logs for $service service..."
    
    Add-Content -Path $outputPath -Value @"

===================== $service LOGS START =====================
Service: $service
Timestamp: $(Get-Date)

"@
    
    # Collect logs
    $gcloudCmd = "gcloud logging read ""resource.type=cloud_run_revision AND resource.labels.service_name=$service"" --limit=200 --format=""value(timestamp,textPayload)"""
    $logs = Invoke-Expression $gcloudCmd
    
    if ($logs) {
        Add-Content -Path $outputPath -Value $logs
    } else {
        Add-Content -Path $outputPath -Value "No logs found for $service service"
    }
    
    Add-Content -Path $outputPath -Value @"

===================== $service LOGS END =======================

"@
}

# Add footer
Add-Content -Path $outputPath -Value @"
------------------------------------------------------
End of consolidated log collection
Collection completed at: $(Get-Date)
"@

Write-Host "Logs saved to $outputPath"
Write-Host "Log collection complete with UUID: $logUuid"

# Open the folder with the logs
explorer CollectLogs 