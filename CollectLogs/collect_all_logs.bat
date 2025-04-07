@echo off
echo Collecting runtime logs for all NIFYA services...

:: Generate a UUID for the log file using PowerShell
FOR /F "tokens=*" %%g IN ('powershell -Command "[guid]::NewGuid().ToString()"') do (SET LOG_UUID=%%g)
echo Log collection UUID: %LOG_UUID%

:: Define output file
set CONSOLIDATED_LOG=consolidated_runtime_logs.log

:: Create the log file with a header
echo ------------------------------------------------------> %CONSOLIDATED_LOG%
echo NIFYA Consolidated Runtime Logs - Version ID: %LOG_UUID%>> %CONSOLIDATED_LOG%
echo Collected on: %date% %time%>> %CONSOLIDATED_LOG%
echo ------------------------------------------------------>> %CONSOLIDATED_LOG%
echo.>> %CONSOLIDATED_LOG%

:: Special handling for backend service (500 lines)
echo Collecting logs for backend service...
echo. >> %CONSOLIDATED_LOG%
echo ===================== backend LOGS START ===================== >> %CONSOLIDATED_LOG%
echo Service: backend >> %CONSOLIDATED_LOG%
echo Timestamp: %date% %time% >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=backend AND textPayload:*" --limit=500 --format="value(timestamp,severity,textPayload)" >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%
echo ===================== backend LOGS END ======================= >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%

:: Special handling for main-page service (400 lines)
echo Collecting logs for main-page service...
echo. >> %CONSOLIDATED_LOG%
echo ===================== main-page LOGS START ===================== >> %CONSOLIDATED_LOG%
echo Service: main-page >> %CONSOLIDATED_LOG%
echo Timestamp: %date% %time% >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=main-page AND textPayload:*" --limit=400 --format="value(timestamp,severity,textPayload)" >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%
echo ===================== main-page LOGS END ======================= >> %CONSOLIDATED_LOG%
echo. >> %CONSOLIDATED_LOG%

:: Define the remaining services to collect logs from (200 lines each)
set SERVICES=subscription-worker notification-worker boe-parser

:: Loop through the remaining services and collect logs
for %%s in (%SERVICES%) do (
    echo Collecting logs for %%s service...
    
    echo. >> %CONSOLIDATED_LOG%
    echo ===================== %%s LOGS START ===================== >> %CONSOLIDATED_LOG%
    echo Service: %%s >> %CONSOLIDATED_LOG%
    echo Timestamp: %date% %time% >> %CONSOLIDATED_LOG%
    echo. >> %CONSOLIDATED_LOG%
    
    :: Collect logs with default limit (200 entries)
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=%%s AND textPayload:*" --limit=200 --format="value(timestamp,severity,textPayload)" >> %CONSOLIDATED_LOG%
    
    echo. >> %CONSOLIDATED_LOG%
    echo ===================== %%s LOGS END ======================= >> %CONSOLIDATED_LOG%
    echo. >> %CONSOLIDATED_LOG%
)

echo. >> %CONSOLIDATED_LOG%
echo ------------------------------------------------------>> %CONSOLIDATED_LOG%
echo End of consolidated log collection >> %CONSOLIDATED_LOG%
echo Collection completed at: %date% %time% >> %CONSOLIDATED_LOG%
echo Collection UUID: %LOG_UUID% >> %CONSOLIDATED_LOG%

echo Logs saved to %CONSOLIDATED_LOG%
echo Log collection complete with UUID: %LOG_UUID% 