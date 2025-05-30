# Collect logs for all NIFYA services using parallel processing
Write-Host "Collecting build and runtime logs for all NIFYA services in parallel..."

# Set the correct Google Cloud account
Write-Host "Switching to Nifia Corporation account..."
& gcloud config set account "nifyacorp@gmail.com"

# Set the project ID
Write-Host "Setting GCP project..."
& gcloud config set project delta-entity-447812-p2

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

# Ensure CollectLogs directory exists
if (-not (Test-Path -Path $logDirPath)) {
    New-Item -ItemType Directory -Path $logDirPath | Out-Null
    Write-Host "Created CollectLogs directory at $logDirPath"
}

# Define the script block that will run for each service
$serviceLogScript = {
    param($service, $serviceIndex, $totalServices, $logDirPath)
    
    Write-Host ("[$serviceIndex/$totalServices] Starting collection for " + $service + " service...")
    
    # Define output file path for this service
    $outputPath = Join-Path -Path $logDirPath -ChildPath "$service.log"
    
    # Create the file with headers
    $header = "==============================================================" + [Environment]::NewLine
    $header += "NIFYA Logs for $service" + [Environment]::NewLine
    $header += "Collected on: $(Get-Date)" + [Environment]::NewLine
    $header += "==============================================================" + [Environment]::NewLine + [Environment]::NewLine
    Set-Content -Path $outputPath -Value $header
    
    # Collect build logs first
    Write-Host ("[$serviceIndex/$totalServices] Fetching build logs for " + $service + "...")
    $buildHeader = "==============================================================" + [Environment]::NewLine
    $buildHeader += "                      BUILD LOGS" + [Environment]::NewLine
    $buildHeader += "==============================================================" + [Environment]::NewLine + [Environment]::NewLine
    Add-Content -Path $outputPath -Value $buildHeader
    
    # Get the most recent build ID for the service using a more specific filter
    $buildLogsCmd = "gcloud builds list --filter=""tags='$service'"" --limit=1 --format=""value(id)"""
    $buildId = Invoke-Expression $buildLogsCmd
    
    if (-not $buildId) {
        # Try alternative filter if tag-based search fails
        $buildLogsCmd = "gcloud builds list --filter=""substitutions.REPO_NAME='$service'"" --limit=1 --format=""value(id)"""
        $buildId = Invoke-Expression $buildLogsCmd
    }
    
    if ($buildId) {
        Write-Host ("[$serviceIndex/$totalServices] Found build ID for " + $service + ": " + $buildId)
        $buildLogsDetailCmd = "gcloud builds log $buildId --format=""value(status,logUrl,steps.args,steps.status)"""
        $buildLogs = Invoke-Expression $buildLogsDetailCmd
        if ($buildLogs) {
            Add-Content -Path $outputPath -Value "Build ID: $buildId"
            Add-Content -Path $outputPath -Value $buildLogs
            
            # Get detailed step logs
            Write-Host ("[$serviceIndex/$totalServices] Fetching detailed build steps for " + $service + "...")
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
    $runtimeHeader = [Environment]::NewLine + "==============================================================" + [Environment]::NewLine
    $runtimeHeader += "                     RUNTIME LOGS" + [Environment]::NewLine
    $runtimeHeader += "==============================================================" + [Environment]::NewLine + [Environment]::NewLine
    Add-Content -Path $outputPath -Value $runtimeHeader
    
    # Collect runtime logs
    Write-Host ("[$serviceIndex/$totalServices] Fetching runtime logs for " + $service + "...")
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
    $footer = [Environment]::NewLine + "==============================================================" + [Environment]::NewLine
    $footer += "End of log collection for $service" + [Environment]::NewLine
    $footer += "Collection completed at: $(Get-Date)" + [Environment]::NewLine
    $footer += "==============================================================" + [Environment]::NewLine
    Add-Content -Path $outputPath -Value $footer
    
    Write-Host ("[$serviceIndex/$totalServices] Completed log collection for " + $service)
    return "Completed: $service"
}

# Define maximum number of concurrent jobs
$maxConcurrentJobs = 3
Write-Host "Using parallel processing with maximum $maxConcurrentJobs concurrent jobs (controlled by PowerShell)"

# Start all jobs immediately
$jobs = @()
$totalServices = $services.Count

for ($i = 0; $i -lt $services.Count; $i++) {
    $service = $services[$i]
    $serviceIndex = $i + 1
    
    Write-Host "Starting job for service $service ($serviceIndex/$totalServices)"
    $job = Start-Job -ScriptBlock $serviceLogScript -ArgumentList $service, $serviceIndex, $totalServices, $logDirPath
    $jobs += $job
}

# Wait for all jobs to complete
if ($jobs.Count -gt 0) {
    Write-Host "Waiting for all $($jobs.Count) jobs to complete..."
    $jobs | Wait-Job | ForEach-Object {
        $result = Receive-Job -Job $_
        Write-Host "Job completed: $result"
        Remove-Job -Job $_
    }
} else {
    Write-Host "No jobs were started successfully."
}

Write-Host "Log collection complete"
Write-Host "Logs saved to individual files in $logDirPath" 