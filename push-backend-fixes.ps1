# PowerShell script to commit and push backend subscription fixes

Write-Host "Committing backend subscription fixes..." -ForegroundColor Cyan

# Navigate to the backend directory
cd backend

# Check current status
Write-Host "Current git status in backend directory:" -ForegroundColor Yellow
git status

# Add the changes
git add src/core/subscription/services/subscription.repository.js
git add src/core/subscription/services/subscription.service.js
git add src/interfaces/http/routes/subscription/crud.routes.js

# Commit changes
git commit -m "Fix subscription system: Improved error handling, added fallback responses, fixed database queries"

# Push changes
Write-Host "Pushing backend changes to GitHub..." -ForegroundColor Yellow
git push origin HEAD:main

# Return to the main repository
cd ..

# Update parent repository
git add backend
git commit -m "Update backend submodule with subscription fixes"
git push origin HEAD:main

Write-Host "Backend changes pushed to GitHub. The build should start automatically." -ForegroundColor Green
Write-Host "Backend will be deployed to Cloud Run with the new changes." -ForegroundColor Green 