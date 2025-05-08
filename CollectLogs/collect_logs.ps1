# Collect logs for all NIFYA services
Write-Host "Collecting build and runtime logs for all NIFYA services..."

# Set the correct Google Cloud account
Write-Host "Switching to Nifia Corporation account..."
& gcloud config set account "nifyacorp@gmail.com"

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
    "eu-parser",
    "email-notification", 
    "subscription-worker", 
    "notification-worker",
    "main-page"
)

# Define base directory for logs - using current script directory
$scriptDir = $PSScriptRoot
$baseLogDir = Join-Path -Path $scriptDir -ChildPath ".."
$logDirPath = Join-Path -Path $baseLogDir -ChildPath "CollectLogs"

# Create a directory for the current log collection if it doesn't exist
$logArchiveDir = Join-Path -Path $logDirPath -ChildPath $logUuid
if (-not (Test-Path -Path $logArchiveDir)) {
    New-Item -ItemType Directory -Path $logArchiveDir | Out-Null
    Write-Host "Created log directory: $logArchiveDir"
}

# Loop through services and collect logs
foreach ($service in $services) {
    Write-Host "Collecting logs for $service service..."
    
    # Define output file path for this service
    $outputPath = Join-Path -Path $logDirPath -ChildPath "$service.log"
    $archivePath = Join-Path -Path $logArchiveDir -ChildPath "$service.log"
    
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
    
    # Get the most recent build ID for the service using a more specific filter
    $buildLogsCmd = "gcloud builds list --filter=""tags='$service'"" --limit=1 --format=""value(id)"""
    $buildId = Invoke-Expression $buildLogsCmd
    
    if (-not $buildId) {
        # Try alternative filter if tag-based search fails
        $buildLogsCmd = "gcloud builds list --filter=""substitutions.REPO_NAME='$service'"" --limit=1 --format=""value(id)"""
        $buildId = Invoke-Expression $buildLogsCmd
    }
    
    if ($buildId) {
        Write-Host "    Found build ID: $buildId"
        $buildLogsDetailCmd = "gcloud builds log $buildId --format=""value(status,logUrl,steps.args,steps.status)"""
        $buildLogs = Invoke-Expression $buildLogsDetailCmd
        if ($buildLogs) {
            Add-Content -Path $outputPath -Value "Build ID: $buildId"
            Add-Content -Path $outputPath -Value $buildLogs
            
            # Get detailed step logs
            Write-Host "    Fetching detailed build steps..."
            $detailedLogs = Invoke-Expression "gcloud builds log $buildId"
            if ($detailedLogs) {
                Add-Content -Path $outputPath -Value "`nDetailed Build Steps:`n"
                Add-Content -Path $outputPath -Value $detailedLogs
            }
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

    # Copy to archive directory
    Copy-Item -Path $outputPath -Destination $archivePath -Force

    Write-Host "Logs for $service saved to $outputPath and archived to $archivePath"
}

Write-Host "Log collection complete with UUID: $logUuid"
Write-Host "Logs saved to $logDirPath and archived in $logArchiveDir"