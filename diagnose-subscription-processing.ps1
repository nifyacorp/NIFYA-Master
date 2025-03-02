# Subscription Processing Diagnostic Script
# This script helps diagnose issues with the subscription processing flow

Write-Host "NIFYA Subscription Processing Diagnostic Tool" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to check a URL's connectivity
function Test-Endpoint {
    param (
        [string]$URL,
        [string]$Description
    )
    
    Write-Host "Checking $Description..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $URL -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✓ Connection successful: $URL" -ForegroundColor Green
        Write-Host "  ✓ Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        
        return $true
    }
    catch [System.Net.WebException] {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "  ✗ Connection failed: $URL" -ForegroundColor Red
        Write-Host "  ✗ Status: $statusCode $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return $false
    }
    catch {
        Write-Host "  ✗ Connection failed: $URL" -ForegroundColor Red
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return $false
    }
}

# Step 1: Check environment files for the correct URLs
Write-Host "Step 1: Checking environment configuration files" -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan

# Check backend .env file
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    Write-Host "Backend .env file found" -ForegroundColor Green
    $backendEnvContent = Get-Content $backendEnvPath -Raw
    
    if ($backendEnvContent -match "SUBSCRIPTION_WORKER_URL=(.+)") {
        $workerUrl = $matches[1].Trim()
        Write-Host "  ✓ SUBSCRIPTION_WORKER_URL is configured: $workerUrl" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ SUBSCRIPTION_WORKER_URL not found in backend .env file" -ForegroundColor Red
        Write-Host "    This might cause the backend to use the default fallback: http://localhost:8080" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Backend .env file not found at $backendEnvPath" -ForegroundColor Red
}

# Check subscription-worker .env file
$workerEnvPath = "subscription-worker\.env"
if (Test-Path $workerEnvPath) {
    Write-Host "Subscription Worker .env file found" -ForegroundColor Green
    $workerEnvContent = Get-Content $workerEnvPath -Raw
    
    if ($workerEnvContent -match "BOE_API_URL=(.+)") {
        $boeApiUrl = $matches[1].Trim()
        Write-Host "  ✓ BOE_API_URL is configured: $boeApiUrl" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ BOE_API_URL not found in worker .env file" -ForegroundColor Red
        Write-Host "    This might cause the worker to use the default fallback: https://boe-parser-415554190254.us-central1.run.app" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Subscription Worker .env file not found at $workerEnvPath" -ForegroundColor Red
}

# Step 2: Check connectivity between services
Write-Host ""
Write-Host "Step 2: Checking connectivity between services" -ForegroundColor Cyan
Write-Host "---------------------------------------------" -ForegroundColor Cyan

# Use the worker URL from the .env file or the default
if (-not $workerUrl) {
    $workerUrl = "http://localhost:8080"
    Write-Host "Using default worker URL: $workerUrl" -ForegroundColor Yellow
}

# Use the BOE API URL from the .env file or the default
if (-not $boeApiUrl) {
    $boeApiUrl = "https://boe-parser-415554190254.us-central1.run.app"
    Write-Host "Using default BOE API URL: $boeApiUrl" -ForegroundColor Yellow
}

# Check backend to subscription worker connectivity
$backendToWorkerResult = Test-Endpoint -URL "$workerUrl/healthz" -Description "Backend → Subscription Worker"

# Check subscription worker to BOE parser connectivity
$workerToBoeResult = Test-Endpoint -URL "$boeApiUrl/health" -Description "Subscription Worker → BOE Parser"

# Step 3: Check for active subscription processing
Write-Host ""
Write-Host "Step 3: Checking for active subscription processing" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

if (Test-Path "backend\logs\app.log") {
    $logContent = Get-Content "backend\logs\app.log" -Tail 100
    
    $processingRequestCount = ($logContent | Select-String "Processing subscription asynchronously" | Measure-Object).Count
    $processingInitiatedCount = ($logContent | Select-String "Subscription processing initiated" | Measure-Object).Count
    
    if ($processingRequestCount -gt 0) {
        Write-Host "  ✓ Recent subscription processing requests found in logs: $processingRequestCount" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No recent subscription processing requests found in logs" -ForegroundColor Red
    }
    
    if ($processingInitiatedCount -gt 0) {
        Write-Host "  ✓ Recent successful subscription processing initiations found: $processingInitiatedCount" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No recent successful subscription processing initiations found" -ForegroundColor Red
    }
}
else {
    Write-Host "  ✗ Backend logs not found at backend\logs\app.log" -ForegroundColor Red
}

# Step 4: Check database configuration
Write-Host ""
Write-Host "Step 4: Checking database configuration" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

if (Test-Path $backendEnvPath) {
    $backendEnvContent = Get-Content $backendEnvPath -Raw
    
    if ($backendEnvContent -match "DB_HOST=(.+)") {
        $dbHost = $matches[1].Trim()
        Write-Host "  ✓ Database host configured: $dbHost" -ForegroundColor Green
    }
}

if (Test-Path $workerEnvPath) {
    $workerEnvContent = Get-Content $workerEnvPath -Raw
    
    if ($workerEnvContent -match "DB_HOST=(.+)") {
        $workerDbHost = $matches[1].Trim()
        Write-Host "  ✓ Worker database host configured: $workerDbHost" -ForegroundColor Green
        
        if ($dbHost -and ($dbHost -ne $workerDbHost)) {
            Write-Host "  ✗ Warning: Backend and worker have different DB_HOST values" -ForegroundColor Yellow
        }
    }
}

# Summary and recommendations
Write-Host ""
Write-Host "Diagnostic Summary" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan

# Provide recommendations based on findings
if (-not $backendToWorkerResult -and -not $workerToBoeResult) {
    Write-Host "Major issue detected: Both connections are failing" -ForegroundColor Red
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "1. Check if all services are running" -ForegroundColor Yellow
    Write-Host "2. Verify network configurations and firewall settings" -ForegroundColor Yellow
    Write-Host "3. Check if service URLs are correct in environment variables" -ForegroundColor Yellow
}
elseif (-not $backendToWorkerResult) {
    Write-Host "Issue detected: Backend cannot connect to Subscription Worker" -ForegroundColor Red
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "1. Check if the Subscription Worker service is running" -ForegroundColor Yellow
    Write-Host "2. Verify the SUBSCRIPTION_WORKER_URL in backend environment" -ForegroundColor Yellow
    Write-Host "3. Check network configurations between backend and worker" -ForegroundColor Yellow
}
elseif (-not $workerToBoeResult) {
    Write-Host "Issue detected: Subscription Worker cannot connect to BOE Parser" -ForegroundColor Red
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "1. Check if the BOE Parser service is running" -ForegroundColor Yellow
    Write-Host "2. Verify the BOE_API_URL in worker environment" -ForegroundColor Yellow
    Write-Host "3. Check network configurations between worker and BOE parser" -ForegroundColor Yellow
}
else {
    Write-Host "No major connectivity issues detected." -ForegroundColor Green
    Write-Host "If subscription processing is still failing, check:" -ForegroundColor Yellow
    Write-Host "1. Database connectivity and data integrity" -ForegroundColor Yellow
    Write-Host "2. Application logs for specific error messages" -ForegroundColor Yellow
    Write-Host "3. Subscription data format and prompts configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Diagnostic completed." -ForegroundColor Cyan 