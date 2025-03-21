# PowerShell script to commit and push subscription fixes to the frontend submodule

Write-Host "Committing subscription fixes to frontend submodule..." -ForegroundColor Cyan

# Navigate to the frontend submodule
cd frontend

# Check submodule status
Write-Host "Current git status in frontend submodule:" -ForegroundColor Yellow
git status

# Stage changes in the frontend submodule
git add src/services/api/subscription-service.ts
git add src/pages/Subscriptions.tsx
git add src/pages/SubscriptionCatalog.tsx

# Commit changes with a descriptive message
git commit -m "Fix subscription system: improved error handling, added fallback BOE templates, better UI for error states"

# Push changes to the submodule's repository
Write-Host "Pushing changes to the frontend submodule. This will trigger a new Netlify build..." -ForegroundColor Yellow
git push origin HEAD:main

# Return to the main repository
cd ..

# Update the parent repository to point to the new commit in the submodule
git add frontend
git commit -m "Update frontend submodule with subscription system fixes"
git push origin HEAD:main

Write-Host "Changes pushed to GitHub. Netlify build should start automatically." -ForegroundColor Green
Write-Host "You can check the build status on GitHub or in the Netlify dashboard." -ForegroundColor Green 