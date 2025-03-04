# Get the content of the file
$content = Get-Content -Path src\components\settings\NotificationsSection.tsx -Raw

# Remove the import for AuthContext
$content = $content -replace "import \{ AuthContext \} from '../../contexts/AuthContext';", ""

# Replace the useContext line with a hardcoded value
$content = $content -replace "const \{ user \} = useContext\(AuthContext\);", "// Hardcoded for testing"

# Remove useContext from the React import
$content = $content -replace "import React, \{ useContext \} from 'react';", "import React from 'react';"

# Write the modified content back to the file
Set-Content -Path src\components\settings\NotificationsSection.tsx -Value $content -Encoding UTF8

Write-Host "NotificationsSection.tsx file updated successfully!" 