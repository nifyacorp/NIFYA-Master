# Script to check notifications database content
# Simplified version to work in any locale

# Set variables
$projectId = "delta-entity-447812-p2"
$instanceName = "nifya-db"
$databaseName = "nifya"
$targetUserId = "F8B0cToym9d3ttRm44916CQb4QA3"

# Set active project
Write-Host "Setting active project to $projectId"
gcloud config set project $projectId

# Get instance info
Write-Host "Getting information about Cloud SQL instances"
gcloud sql instances list

# Instructions for manual querying since we need to connect interactively
Write-Host "`nInstructions for querying the database"
Write-Host "1. Connect to the database using the following command"
Write-Host "   gcloud sql connect $instanceName --user=postgres --database=$databaseName"
Write-Host "2. When prompted, enter the database password"
Write-Host "3. Once connected, run these SQL queries"
Write-Host "   a. Count total notifications"
Write-Host "      SELECT COUNT(*) FROM notifications;"
Write-Host "   b. Get 10 most recent notifications"
Write-Host "      SELECT id, user_id, title, SUBSTR(content, 1, 50) as content_preview, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 10;"
Write-Host "   c. Get notifications for user"
Write-Host "      SELECT id, title, SUBSTR(content, 1, 50) as content_preview, read, created_at FROM notifications"
Write-Host "      WHERE user_id = '$targetUserId' ORDER BY created_at DESC LIMIT 10;"
Write-Host "4. To exit the PostgreSQL client, type \q"

# Offer to connect directly
Write-Host "`nWould you like to connect to the database now? (Y/N)"
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "Connecting to the database. Enter the password when prompted."
    gcloud sql connect $instanceName --user=postgres --database=$databaseName
} else {
    Write-Host "You can connect manually using the command above whenever ready."
}

Write-Host "`nScript completed" 