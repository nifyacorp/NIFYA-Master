@echo off
setlocal enabledelayedexpansion

echo Collecting runtime error logs for multiple services...

:: Create CollectLogs directory if it doesn't exist
if not exist CollectLogs mkdir CollectLogs

:: Define the output log file and clear it
set LOGFILE=CollectLogs\consolidated_runtime_errors.log
echo Collecting logs started at %date% %time% > %LOGFILE%
echo ========================================== >> %LOGFILE%

:: Define the services to collect logs from
set SERVICES=backend main_page subscription-worker notification-worker boe-parser

:: Generate a UUID base
set "UUID_BASE=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "UUID_BASE=%UUID_BASE: =0%"

:: Set a counter for sequential IDs
set COUNTER=1

:: Loop through each service and collect logs
for %%s in (%SERVICES%) do (
    echo Collecting error logs for %%s...
    echo. >> %LOGFILE%
    echo ================ LOGS FOR %%s - STARTED ================ >> %LOGFILE%
    
    :: Run gcloud command directly
    echo Fetching logs for %%s. This may take a moment...
    
    :: Create a temporary file for this service's logs
    set "TEMP_LOG=CollectLogs\%%s_temp.json"
    
    :: Run the gcloud command and redirect to the temp file
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=%%s AND severity>=ERROR" --limit=500 --format=json > "!TEMP_LOG!" 2>nul
    
    :: Check if we got results
    for %%f in ("!TEMP_LOG!") do set size=%%~zf
    if !size! GTR 10 (
        :: File has content - process each line
        for /f "usebackq tokens=*" %%l in ("!TEMP_LOG!") do (
            set "CURRENT_UUID=%UUID_BASE%_%%s_!COUNTER!"
            echo [!CURRENT_UUID!] %%l >> %LOGFILE%
            set /a COUNTER+=1
        )
    ) else (
        echo No error logs found for %%s >> %LOGFILE%
    )
    
    :: Clean up
    if exist "!TEMP_LOG!" del "!TEMP_LOG!"
    
    echo ================ LOGS FOR %%s - COMPLETED ================ >> %LOGFILE%
)

echo. >> %LOGFILE%
echo Log collection completed at %date% %time% >> %LOGFILE%
echo Log collection complete. Logs saved to %LOGFILE%

endlocal 