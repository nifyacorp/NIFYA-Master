#!/bin/bash

# Create a new BOE subscription
echo "Creating a new BOE subscription..."

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

# Create a JSON payload for subscription creation
read -r -d '' SUB_PAYLOAD << EOM
{
  "type": "boe",
  "name": "Test BOE Subscription",
  "prompts": ["quiero ser funcionario", "oposiciones administrativo"],
  "active": true
}
EOM

# Make the curl request to create subscription
echo "Creating subscription via curl..."
curl -v -X POST \
  "https://backend-415554190254.us-central1.run.app/api/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SUB_PAYLOAD" \
  -o create_subscription_response.json

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "Subscription creation request sent successfully."
  echo "Response saved to create_subscription_response.json"
  
  # Extract subscription ID from response
  SUB_ID=$(cat create_subscription_response.json | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
  
  if [ -n "$SUB_ID" ]; then
    echo "Subscription created with ID: $SUB_ID"
    echo "$SUB_ID" > latest_subscription_id.txt
    echo "Subscription ID saved to latest_subscription_id.txt"
  else
    echo "Could not extract subscription ID from response. Check create_subscription_response.json for details."
  fi
else
  echo "Subscription creation request failed."
fi