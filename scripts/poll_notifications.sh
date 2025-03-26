#!/bin/bash

# Poll for notifications
echo "Polling for notifications..."

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

# Check for subscription ID
SUB_ID=""
if [ -f latest_subscription_id.txt ]; then
  SUB_ID=$(cat latest_subscription_id.txt)
  echo "Using subscription ID: $SUB_ID"
else
  echo "No subscription ID found. Will poll for all notifications."
fi

# Number of polling attempts
MAX_ATTEMPTS=10
ATTEMPT=1
POLL_INTERVAL=5  # seconds

echo "Will poll for notifications $MAX_ATTEMPTS times with $POLL_INTERVAL second intervals"

# Poll in a loop
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Attempt $ATTEMPT of $MAX_ATTEMPTS..."
  
  # Create notification URL
  NOTIFICATION_URL="https://backend-415554190254.us-central1.run.app/api/notifications"
  if [ -n "$SUB_ID" ]; then
    NOTIFICATION_URL="${NOTIFICATION_URL}?subscription_id=${SUB_ID}"
  fi
  
  # Make the curl request to get notifications
  echo "Fetching notifications from $NOTIFICATION_URL"
  curl -s -X GET \
    "$NOTIFICATION_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -o "notifications_${ATTEMPT}.json"
  
  # Check if the request was successful
  if [ $? -eq 0 ]; then
    echo "Notifications request successful."
    
    # Count notifications
    NUM_NOTIFS=$(cat "notifications_${ATTEMPT}.json" | grep -o '"id"' | wc -l)
    echo "Found $NUM_NOTIFS notifications."
    
    if [ $NUM_NOTIFS -gt 0 ]; then
      echo "Notifications found! Stopping polling."
      echo "Results saved to notifications_${ATTEMPT}.json"
      break
    fi
  else
    echo "Notifications request failed."
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  
  if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
    echo "Waiting $POLL_INTERVAL seconds before next attempt..."
    sleep $POLL_INTERVAL
  fi
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "Max polling attempts reached without finding notifications."
else
  echo "Polling completed successfully."
fi