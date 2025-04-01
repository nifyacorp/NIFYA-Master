# Notification Display Fix Implementation

## Issue Summary

Users reported that notifications appeared with counts in the UI but the notification content was not properly displayed. Our investigation revealed that the frontend code expected notifications to have a standardized `entity_type` field in a specific format (`domain:type`), but this field was either:

1. Missing entirely from some notifications
2. Stored inconsistently inside the `metadata` JSON object
3. Not following the expected format with a colon separator

This issue affected all notification types but was most noticeable with BOE notifications.

## Root Cause

The notification system had several components that evolved independently:

1. **Notification Worker**: Created notifications with `entity_type` stored in metadata
2. **Backend API**: Expected to find `entity_type` as a top-level field
3. **Frontend**: Expected `entity_type` to be in the format `domain:type` 

The issue occurred because the notification worker was saving entity_type inconsistently, sometimes in metadata and without the proper format, while the frontend was expecting it to be a separate field with a specific format.

## Implementation Details

### 1. Database Schema Update

Added a dedicated `entity_type` column to the `notifications` table through a migration:

```sql
-- Add entity_type column to notifications table if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN entity_type text DEFAULT 'notification:generic';

-- Create an index on entity_type for performance
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type ON notifications(entity_type);

-- Update existing notifications to populate entity_type from metadata if possible
UPDATE notifications 
SET entity_type = 
  CASE
    -- If metadata has entity_type field, use that
    WHEN metadata ? 'entity_type' AND metadata->>'entity_type' != '' THEN 
      metadata->>'entity_type'
    -- If metadata has document_type field, create a BOE entity type  
    WHEN metadata ? 'document_type' AND metadata->>'document_type' != '' THEN 
      'boe:' || metadata->>'document_type'
    -- If notification has BOE in title, use boe:document
    WHEN title ILIKE '%BOE%' THEN 
      'boe:document'
    -- Otherwise, use a generic type
    ELSE 
      'notification:generic'
  END
WHERE entity_type IS NULL OR entity_type = '';
```

### 2. Notification Worker Update

Updated the notification worker's `createNotification` function to store entity_type as a proper column:

```javascript
// Before
const result = await db.withRLSContext(userId, async (client) => {
  const insertResult = await client.query(
    `INSERT INTO notifications (
      user_id,
      subscription_id,
      title,
      content,
      source_url,
      metadata,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      userId,
      subscriptionId,
      title || 'Notification',
      content || '',
      sourceUrl,
      JSON.stringify(metadata),
      new Date()
    ]
  );
  
  return insertResult;
});

// After
const result = await db.withRLSContext(userId, async (client) => {
  const insertResult = await client.query(
    `INSERT INTO notifications (
      user_id,
      subscription_id,
      title,
      content,
      source_url,
      metadata,
      entity_type,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      userId,
      subscriptionId,
      title || 'Notification',
      content || '',
      sourceUrl,
      JSON.stringify(metadata),
      entity_type, // Add entity_type to the database
      new Date()
    ]
  );
  
  return insertResult;
});
```

### 3. Batch Notification Creation

Also updated the batch creation method to store entity_type in its own column:

```javascript
// Updated entity_type creation in createNotifications
const entityType = `boe:${doc.document_type?.toLowerCase() || 'document'}`;

// In the database insert query, we've added entity_type as a separate column
const result = await db.query(
  `INSERT INTO notifications (
    user_id,
    subscription_id,
    title,
    content,
    source_url,
    metadata,
    entity_type,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id`,
  [
    user_id,
    subscription_id,
    notificationTitle,
    doc.summary,
    doc.links?.html || '',
    JSON.stringify({
      // Removed entity_type from metadata since it's now a dedicated column
      prompt: match.prompt,
      relevance: doc.relevance_score,
      document_type: doc.document_type,
      original_title: doc.title,
      processor_type: message.processor_type,
      // other metadata fields...
    }),
    entityType, // Store entity_type in its own column
    new Date()
  ],
  { maxRetries: 2 }
);
```

## Testing Results

After implementing the fix:

1. Existing notifications were updated with the proper entity_type format
2. New notifications are correctly created with the entity_type stored in its own column
3. The frontend can now properly parse and display all notifications

## Future Considerations

1. **Schema Validation**: Implement stricter schema validation to ensure entity_type follows the required format
2. **Documentation**: Update API documentation to clearly specify the entity_type format requirements
3. **Frontend Resilience**: Enhance frontend code to handle missing or malformed entity_type values more gracefully
4. **Monitoring**: Add specific monitoring for notification display issues to catch similar problems earlier

## Conclusion

This fix addresses the immediate issue with notification display by standardizing how the entity_type field is stored and formatted. The solution ensures backwards compatibility with existing notifications while providing a more robust structure for future notifications.

The fix was implemented with minimal disruption, as the database migration updates existing notifications with reasonable entity_type values based on available metadata, and the code changes ensure new notifications will always have a properly formatted entity_type field.