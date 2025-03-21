# PowerShell script to commit and push fixes to the frontend repository

Write-Host "Committing subscription form fixes to frontend submodule..." -ForegroundColor Cyan

# Navigate to the frontend submodule
cd frontend

# Check submodule status
Write-Host "Current git status in frontend submodule:" -ForegroundColor Yellow
git status

# Stage changes in the frontend submodule
git add src/pages/SubscriptionPrompt.tsx
git add src/lib/api/schemas.ts

# Commit changes with a descriptive message
git commit -m "Fix subscription form submission: improve prompt validation and add better error handling"

# Push changes to the submodule's repository
Write-Host "Pushing changes to the frontend submodule. This will trigger a new Netlify build..." -ForegroundColor Yellow
git push origin HEAD:main

# Return to the main repository
cd ..

# Update the parent repository to point to the new commit in the submodule
git add frontend
git commit -m "Update frontend submodule with subscription form submission fixes"
git push origin HEAD:main

Write-Host "Changes pushed to GitHub. Netlify build should start automatically." -ForegroundColor Green
Write-Host "You can check the build status in the Netlify dashboard." -ForegroundColor Green 