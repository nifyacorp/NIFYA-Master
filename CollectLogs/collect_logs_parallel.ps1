# Collect logs for all NIFYA services using parallel processing
Write-Host "Collecting build and runtime logs for all NIFYA services in parallel..."

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

# Create a directory for the current log collection if it doesn't exist
$logDir = "CollectLogs\$logUuid"
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
    Write-Host "Created log directory: $logDir"
}

# Define the script block that will run for each service
$serviceLogScript = {
    param($service, $logUuid, $logDir, $serviceIndex, $totalServices)
    
    Write-Host "[$serviceIndex/$totalServices] Starting collection for $service service..."
    
    # Define output file path for this service
    $outputPath = "$logDir\$service.log"
    
    # Create the file with headers
    Set-Content -Path $outputPath -Value @"
==============================================================
NIFYA Logs for $service - Version ID: $logUuid
Collected on: $(Get-Date)
==============================================================

"@
    
    # Collect build logs first
    Write-Host "[$serviceIndex/$totalServices] Fetching build logs for $service..."
    $buildLogsHeader = @"
==============================================================
                      BUILD LOGS
==============================================================

"@
    Add-Content -Path $outputPath -Value $buildLogsHeader
    
    # Get the most recent build ID for the service using a more specific filter
    $buildLogsCmd = "gcloud builds list --filter=""tags='$service'"" --limit=1 --format=""value(id)"""
    $buildId = Invoke-Expression $buildLogsCmd
    
    if (-not $buildId) {
        # Try alternative filter if tag-based search fails
        $buildLogsCmd = "gcloud builds list --filter=""substitutions.REPO_NAME='$service'"" --limit=1 --format=""value(id)"""
        $buildId = Invoke-Expression $buildLogsCmd
    }
    
    if ($buildId) {
        Write-Host "[$serviceIndex/$totalServices] Found build ID for $service: $buildId"
        $buildLogsDetailCmd = "gcloud builds log $buildId --format=""value(status,logUrl,steps.args,steps.status)"""
        $buildLogs = Invoke-Expression $buildLogsDetailCmd
        if ($buildLogs) {
            Add-Content -Path $outputPath -Value "Build ID: $buildId"
            Add-Content -Path $outputPath -Value $buildLogs
            
            # Get detailed step logs
            Write-Host "[$serviceIndex/$totalServices] Fetching detailed build steps for $service..."
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
    Write-Host "[$serviceIndex/$totalServices] Fetching runtime logs for $service..."
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

    # Also save to standard location for backward compatibility
    Copy-Item -Path $outputPath -Destination "CollectLogs\$service.log" -Force
    
    Write-Host "[$serviceIndex/$totalServices] Completed log collection for $service"
    return "Completed: $service"
}

# Define maximum number of concurrent jobs
$maxConcurrentJobs = 3
Write-Host "Using parallel processing with maximum $maxConcurrentJobs concurrent jobs"

# Track jobs
$jobs = @()
$completedServices = 0
$totalServices = $services.Count

# Start initial batch of jobs
$jobCount = [Math]::Min($maxConcurrentJobs, $services.Count)
for ($i = 0; $i -lt $jobCount; $i++) {
    $service = $services[$i]
    $serviceIndex = $i + 1
    
    Write-Host "Starting job for service $service ($serviceIndex/$totalServices)"
    $job = Start-Job -ScriptBlock $serviceLogScript -ArgumentList $service, $logUuid, $logDir, $serviceIndex, $totalServices
    $jobs += @{
        Index = $i
        Service = $service
        Job = $job
    }
}

# Process services in a pipeline fashion
$nextServiceIndex = $jobCount
while ($completedServices -lt $totalServices) {
    # Check for completed jobs
    foreach ($jobInfo in @($jobs)) {
        if ($jobInfo.Job.State -eq "Completed") {
            # Get job results
            $result = Receive-Job -Job $jobInfo.Job
            Write-Host "Job completed for $($jobInfo.Service): $result"
            
            # Clean up job
            Remove-Job -Job $jobInfo.Job
            $jobs = $jobs | Where-Object { $_.Index -ne $jobInfo.Index }
            
            # Start a new job if there are more services
            if ($nextServiceIndex -lt $services.Count) {
                $service = $services[$nextServiceIndex]
                $currentIndex = $nextServiceIndex + 1
                
                Write-Host "Starting job for service $service ($currentIndex/$totalServices)"
                $job = Start-Job -ScriptBlock $serviceLogScript -ArgumentList $service, $logUuid, $logDir, $currentIndex, $totalServices
                $jobs += @{
                    Index = $nextServiceIndex
                    Service = $service
                    Job = $job
                }
                
                $nextServiceIndex++
            }
            
            $completedServices++
        }
    }
    
    # Short pause to avoid CPU thrashing
    Start-Sleep -Milliseconds 500
}

Write-Host "Log collection complete with UUID: $logUuid"
Write-Host "Logs saved to individual files in CollectLogs\ and archived in $logDir" 