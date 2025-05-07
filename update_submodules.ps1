$submodules = @(
    "backend",
    "boe-parser",
    "doga-parser", 
    "email-notification", 
    "eu-parser", 
    "frontend", 
    "notification-worker", 
    "subscription-worker"
)

foreach ($submodule in $submodules) {
    Write-Host "Updating $submodule..." -ForegroundColor Cyan
    Set-Location -Path $submodule
    git checkout main
    git fetch --all
    git reset --hard origin/main
    Set-Location -Path ..
}

Write-Host "All submodules updated successfully!" -ForegroundColor Green 