#!/bin/bash
# NIFYA Notification Pipeline Test Script
# 
# This script runs an end-to-end test of the notification pipeline:
# 1. Authenticates with the backend
# 2. Processes a BOE subscription to generate notifications
# 3. Polls for notifications to verify they were created

set -e  # Exit immediately if any command fails

# Color codes for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}NIFYA Notification Pipeline End-to-End Test${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check for subscription ID argument
SUBSCRIPTION_ID=${1:-"bbcde7bb-bc04-4a0b-8c47-01682a31cc15"}

echo -e "${YELLOW}Using subscription ID: ${SUBSCRIPTION_ID}${NC}"

# Step 1: Authenticate
echo -e "\n${BLUE}Step 1: Authenticating with backend...${NC}"
node auth-login.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Authentication failed. Exiting.${NC}"
  exit 1
else
  echo -e "${GREEN}Authentication successful.${NC}"
fi

# Step 2: Process subscription
echo -e "\n${BLUE}Step 2: Processing subscription to generate notifications...${NC}"
echo -e "${YELLOW}Running: node process-subscription-v1.js ${SUBSCRIPTION_ID}${NC}"
node process-subscription-v1.js $SUBSCRIPTION_ID
if [ $? -ne 0 ]; then
  echo -e "${RED}Subscription processing failed. Continuing anyway to check for existing notifications.${NC}"
else
  echo -e "${GREEN}Subscription processed successfully.${NC}"
fi

# Optional pause to allow time for notification processing
echo -e "\n${YELLOW}Waiting 5 seconds for notification processing...${NC}"
sleep 5

# Step 3: Poll for notifications
echo -e "\n${BLUE}Step 3: Polling for notifications...${NC}"
echo -e "${YELLOW}Running: node poll-notifications.js ${SUBSCRIPTION_ID}${NC}"
node poll-notifications.js $SUBSCRIPTION_ID
if [ $? -ne 0 ]; then
  echo -e "${RED}Notification polling returned an error. Check the output above for details.${NC}"
  exit 1
fi

# Check for notification results
if [ -f "latest_notifications.json" ]; then
  NOTIFICATION_COUNT=$(grep -o '"id":' latest_notifications.json | wc -l)
  echo -e "\n${GREEN}Found ${NOTIFICATION_COUNT} notifications in latest_notifications.json${NC}"
  
  if [ $NOTIFICATION_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Notification pipeline test SUCCESSFUL!${NC}"
    echo -e "${GREEN}Notifications were successfully created and retrieved.${NC}"
  else
    echo -e "${YELLOW}⚠️ Notification pipeline test PARTIAL SUCCESS${NC}"
    echo -e "${YELLOW}Notifications file was created but contains 0 notifications.${NC}"
  fi
else
  echo -e "\n${RED}❌ Notification pipeline test FAILED${NC}"
  echo -e "${RED}No notification file was created. Check the logs for errors.${NC}"
fi

echo -e "\n${BLUE}Test execution completed at $(date)${NC}"
echo -e "${BLUE}See TEST_DETAILS.txt for complete test results.${NC}"

# Create a summary file with timestamp
SUMMARY_FILE="notification_pipeline_test_$(date +%Y%m%d_%H%M%S).log"
echo "NIFYA Notification Pipeline Test Summary - $(date)" > $SUMMARY_FILE
echo "Subscription ID: $SUBSCRIPTION_ID" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE
echo "Authentication: $(test -f 'auth_token.txt' && echo 'SUCCESS' || echo 'FAILED')" >> $SUMMARY_FILE
echo "Subscription Processing: $(test -f 'process_subscription_response.json' && echo 'SUCCESS' || echo 'FAILED')" >> $SUMMARY_FILE
echo "Notification Polling: $(test -f 'latest_notifications.json' && echo 'SUCCESS' || echo 'FAILED')" >> $SUMMARY_FILE
echo "" >> $SUMMARY_FILE

if [ -f "latest_notifications.json" ]; then
  echo "Notifications Found: $NOTIFICATION_COUNT" >> $SUMMARY_FILE
  echo "Overall Result: $([ $NOTIFICATION_COUNT -gt 0 ] && echo 'SUCCESS' || echo 'PARTIAL SUCCESS - 0 notifications')" >> $SUMMARY_FILE
else
  echo "Notifications Found: 0" >> $SUMMARY_FILE
  echo "Overall Result: FAILED - No notification file created" >> $SUMMARY_FILE
fi

echo -e "${BLUE}Summary saved to ${SUMMARY_FILE}${NC}"