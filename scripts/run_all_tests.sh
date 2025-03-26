#!/bin/bash

# Main script to run all tests in sequence
echo "========================================================"
echo "NIFYA Backend Testing Suite"
echo "========================================================"

# Make all scripts executable
chmod +x *.sh

# Step 1: Authentication
echo "Step 1: Testing authentication..."
./test_auth.sh
if [ ! -f auth_token.txt ]; then
  echo "Authentication failed. Cannot continue tests."
  exit 1
fi
echo "Authentication successful."
echo "========================================================" 

# Step 2: Get user profile
echo "Step 2: Testing user profile retrieval..."
./test_profile.sh
echo "========================================================" 

# Step 3: List current subscriptions
echo "Step 3: Listing current subscriptions..."
./test_subscriptions.sh
echo "========================================================" 

# Step 4: Create a new BOE subscription
echo "Step 4: Creating a new BOE subscription..."
./create_boe_subscription.sh
if [ ! -f latest_subscription_id.txt ]; then
  echo "Subscription creation failed. Cannot continue with subscription-specific tests."
else
  echo "Subscription created successfully with ID: $(cat latest_subscription_id.txt)"
fi
echo "========================================================" 

# Step 5: Poll for notifications (with delay to allow processing)
echo "Step 5: Waiting for subscription processing (30 seconds)..."
sleep 30

echo "Step 6: Polling for notifications..."
./poll_notifications.sh
echo "========================================================" 

echo "All tests completed."
echo "Check the JSON response files for detailed results."