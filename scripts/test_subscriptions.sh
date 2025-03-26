#!/bin/bash

# Test subscriptions endpoint
echo "Testing subscriptions endpoint..."

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

# Make the curl request to get subscriptions
echo "Fetching subscriptions..."
curl -v -X GET \
  "https://backend-415554190254.us-central1.run.app/api/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -o subscriptions_response.json

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "Subscriptions request sent successfully."
  echo "Response saved to subscriptions_response.json"
  
  # Count and display subscriptions
  NUM_SUBS=$(cat subscriptions_response.json | grep -o '"id"' | wc -l)
  echo "Found $NUM_SUBS subscriptions."
else
  echo "Subscriptions request failed."
fi