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

# Create a directory for the current log collection if it doesn't exist
$logDir = "CollectLogs\$logUuid"
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
    Write-Host "Created log directory: $logDir"
}

# Function to collect logs for a single service
function Get-ServiceLogs {
    param(
        [string]$service,
        [string]$logUuid,
        [string]$logDir
    )
    
    Write-Host "Collecting logs for $service service..."
    
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
    Write-Host "  Fetching build logs for $service..."
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
        Write-Host "    Found build ID for $service: $buildId"
        $buildLogsDetailCmd = "gcloud builds log $buildId --format=""value(status,logUrl,steps.args,steps.status)"""
        $buildLogs = Invoke-Expression $buildLogsDetailCmd
        if ($buildLogs) {
            Add-Content -Path $outputPath -Value "Build ID: $buildId"
            Add-Content -Path $outputPath -Value $buildLogs
            
            # Get detailed step logs
            Write-Host "    Fetching detailed build steps for $service..."
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
    Write-Host "  Fetching runtime logs for $service..."
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
    
    # Copy to the original location for backward compatibility
    Copy-Item -Path "$logDir\$service.log" -Destination "CollectLogs\$service.log" -Force
}

# Check if running PowerShell 7+ for parallel processing
$psVersion = $PSVersionTable.PSVersion.Major
if ($psVersion -ge 7) {
    Write-Host "Using parallel processing to collect logs..."
    
    # Define maximum number of concurrent jobs
    $maxConcurrentJobs = 4
    $runningJobs = @()
    
    # Start jobs for each service
    foreach ($service in $services) {
        # Start a new job for this service
        $job = Start-Job -ScriptBlock {
            param($service, $logUuid, $logDir, $functionDef)
            
            # Define the function in this job's scope
            Invoke-Expression $functionDef
            
            # Call the function
            Get-ServiceLogs -service $service -logUuid $logUuid -logDir $logDir
        } -ArgumentList $service, $logUuid, $logDir, ${function:Get-ServiceLogs}.ToString()
        
        $runningJobs += $job
        
        # Limit the number of concurrent jobs
        while (($runningJobs | Where-Object { $_.State -eq 'Running' }).Count -ge $maxConcurrentJobs) {
            Start-Sleep -Seconds 1
            # Update the list of running jobs
            $runningJobs = $runningJobs | Where-Object { $_.State -eq 'Running' }
        }
    }
    
    # Wait for all remaining jobs to complete
    $runningJobs | Wait-Job | Receive-Job -Keep
    
    Write-Host "All log collection jobs completed"
    
    # Clean up jobs
    Get-Job | Remove-Job -Force
} else {
    Write-Host "PowerShell 7+ not detected, using sequential processing..."
    
    # Process each service sequentially
    foreach ($service in $services) {
        Get-ServiceLogs -service $service -logUuid $logUuid -logDir $logDir
    }
}

Write-Host "Log collection complete with UUID: $logUuid"
Write-Host "Logs saved to individual files in CollectLogs\ and archived in $logDir"