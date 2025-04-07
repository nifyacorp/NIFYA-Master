@echo off
echo Collecting runtime logs for backend service...

:: Create CollectLogs directory if it doesn't exist
if not exist CollectLogs mkdir CollectLogs

echo Collecting backend runtime logs...
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=backend AND textPayload:*" --limit=50 --format="value(textPayload)" > CollectLogs\backend_runtime_logs.txt
echo Logs saved to CollectLogs\backend_runtime_logs.txt

echo Log collection complete. 