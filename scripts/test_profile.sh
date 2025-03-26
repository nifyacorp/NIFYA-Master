#!/bin/bash

# Test user profile endpoint
echo "Testing user profile endpoint..."

# Check if auth_token.txt exists
if [ ! -f auth_token.txt ]; then
  echo "Auth token not found. Please run test_auth.sh first."
  exit 1
fi

# Read the token from file
TOKEN=$(cat auth_token.txt)

if [ -z "$TOKEN" ]; then
  echo "Auth token is empty. Please authenticate first."
  exit 1
fi

# Make the curl request to get user profile
echo "Fetching user profile..."
curl -v -X GET \
  "https://backend-415554190254.us-central1.run.app/api/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -o profile_response.json

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "Profile request sent successfully."
  echo "Response saved to profile_response.json"
  
  # Display basic profile info
  echo "Profile information:"
  cat profile_response.json | grep -o '"id":"[^"]*' | grep -o '[^"]*$'
  cat profile_response.json | grep -o '"email":"[^"]*' | grep -o '[^"]*$'
else
  echo "Profile request failed."
fi