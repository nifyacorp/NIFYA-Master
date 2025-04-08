# Collect logs for all NIFYA services
Write-Host "Collecting build and runtime logs for all NIFYA services..."

# Set the project ID
Write-Host "Setting GCP project..."
& gcloud config set project delta-entity-447812-p2

# Create a UUID for this log collection
$logUuid = [guid]::NewGuid().ToString()
Write-Host "Log UUID: $logUuid"

# Define all services to collect logs from
$services = @(
    "backend",
    "authentication-service", 
    "boe-parser", 
    "doga-parser", 
    "email-notification", 
    "subscription-worker", 
    "notification-worker",
    "main-page"
)

# Loop through services and collect logs
foreach ($service in $services) {
    Write-Host "Collecting logs for $service service..."
    
    # Define output file path for this service
    $outputPath = "CollectLogs\$service.log"
    
    # Create the file with headers
    Set-Content -Path $outputPath -Value @"
==============================================================
NIFYA Logs for $service - Version ID: $logUuid
Collected on: $(Get-Date)
==============================================================

"@
    
    # Collect build logs first
    Write-Host "  Fetching build logs..."
    Add-Content -Path $outputPath -Value @"
==============================================================
                      BUILD LOGS
==============================================================

"@
    
    $buildLogsCmd = "gcloud builds list --filter=""source.repoSource.repoName=$service"" --limit=1 --format=""value(id)"""
    $buildId = Invoke-Expression $buildLogsCmd
    
    if ($buildId) {
        $buildLogsDetailCmd = "gcloud builds log $buildId"
        $buildLogs = Invoke-Expression $buildLogsDetailCmd
        if ($buildLogs) {
            Add-Content -Path $outputPath -Value $buildLogs
        } else {
            Add-Content -Path $outputPath -Value "No build logs found for build ID: $buildId"
        }
    } else {
        Add-Content -Path $outputPath -Value "No recent builds found for $service"
    }
    
    # Add separator between build and runtime logs
    Add-Content -Path $outputPath -Value @"

==============================================================
                     RUNTIME LOGS
==============================================================

"@
    
    # Collect runtime logs
    Write-Host "  Fetching runtime logs..."
    # Set log limit based on service
    $logLimit = if ($service -eq "backend") { 1000 } else { 200 }
    $runtimeLogsCmd = "gcloud logging read ""resource.type=cloud_run_revision AND resource.labels.service_name=$service"" --limit=$logLimit --format=""value(timestamp,textPayload)"""
    $runtimeLogs = Invoke-Expression $runtimeLogsCmd
    
    if ($runtimeLogs) {
        Add-Content -Path $outputPath -Value $runtimeLogs
    } else {
        Add-Content -Path $outputPath -Value "No runtime logs found for $service service"
    }
    
    # Add footer
    Add-Content -Path $outputPath -Value @"

==============================================================
End of log collection for $service
Collection completed at: $(Get-Date)
==============================================================
"@

    Write-Host "Logs for $service saved to $outputPath"
}

Write-Host "Log collection complete with UUID: $logUuid"