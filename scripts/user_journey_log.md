# NIFYA User Journey Test

Started: 2025-03-27T09:34:58.972Z


## Step 1: Login

Status: ✅ SUCCESS

- User ID: 65c6074d-dbc4-4091-8e45-b6aecffd9ab9
- Token received: Yes
- Response code: 200

## Step 2: Get User Profile

Status: ✅ SUCCESS

- Email: ratonxi@gmail.com
- Name: Test
- Response code: 200

## Step 3: List Subscriptions

Status: ❌ FAILED

- Status code: 301
- Error: "Failed to list subscriptions"

## Step 4: Process Subscription

Status: ❌ FAILED

- Status code: 308
- Error: "Failed to process subscription"

## Step 5: Poll for Notifications

Status: ⏳ STARTED

- Will poll 12 times with 5 second intervals

### Polling attempt 1: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 2: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 3: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 4: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 5: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 6: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 7: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 8: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 9: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 10: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 11: ERROR

- Status code: 404
- Error: "Not Found"

### Polling attempt 12: ERROR

- Status code: 404
- Error: "Not Found"

## Step 5: Poll for Notifications

Status: ⚠️ NO NOTIFICATIONS

- No notifications found after 12 polling attempts
- This may indicate an issue in the notification pipeline

## Journey Summary

- **Start time:** 2025-03-27T09:34:58.972Z
- **End time:** 2025-03-27T09:35:57.663Z
- **Duration:** 58.69 seconds
- **Steps completed:** 5/5
- **Successful steps:** 2
- **Failed steps:** 3
- **Errors encountered:** 0

### Results by Step:
1. Login: ✅ Success
2. Get Profile: ✅ Success
3. List Subscriptions: ❌ Failed
4. Process Subscription: ❌ Failed
5. Poll for Notifications: ⚠️ No Notifications

### Potential Issues:
- None detected
- Subscription ID bbcde7bb-bc04-4a0b-8c47-01682a31cc15 not found
- No notifications detected after subscription processing

### Next Steps:
- Run more detailed tests for each component
- Verify the subscription ID
- Check notification worker logs for issues
