# AI Prompt Enhancement Feature Implementation Plan

## Overview

This document outlines the plan to implement a feature that enhances subscription prompts using Google Gemini AI. The feature will be accessible via a "Mejorar con IA" button in the subscription creation/edit pages. When clicked, this button will send the current prompt to the backend, which will then use Google Gemini to enhance it and return the improved version.

## Requirements

1. Add a backend endpoint to handle AI prompt enhancement requests
2. Integrate Google Gemini AI API
3. Update frontend to send requests and display enhanced prompts
4. Add loading states during API calls
5. Allow users to accept or ignore the enhanced prompt

## Backend Implementation

### 1. Create New API Endpoint

Add a new endpoint in the backend service to handle prompt enhancement requests.

**Endpoint:** `POST /api/v1/subscriptions/enhance-prompt`

**Request Body:**
```json
{
  "subscriptionId": "string",  // Optional, if enhancing an existing subscription
  "subscriptionType": "string", // e.g., "DOGA", "BOE"
  "currentPrompt": "string",    // The user's current prompt
  "userId": "string"            // User ID for retrieving user profile/biography
}
```

**Response:**
```json
{
  "enhancedPrompt": "string",  // The AI-enhanced prompt
  "originalPrompt": "string"   // The original prompt for reference
}
```

### 2. Create Prompt Enhancement Service

Create a new service that will handle the integration with Google Gemini AI.

Location: `backend/src/services/prompt-enhancement-service.ts`

Functionality:
- Retrieve subscription type details from the database
- Retrieve user biography information
- Format a request to Google Gemini AI
- Process and sanitize the response
- Ensure the enhanced prompt is limited to 500 characters

### 3. Google Gemini Integration

Add Google Gemini AI client integration.

Location: `backend/src/services/ai-client-service.ts`

Functionality:
- Set up authentication with Google Gemini API
- Create a method to send prompts to the AI
- Handle API responses and errors
- Format the prompt to include instructions for enhancement

**Example Gemini Prompt Template:**
```
Enhance the following search prompt to make it more effective and comprehensive. 
The prompt is for searching in the ${subscriptionTypeDescription} database.

User profile information:
${userBiography}

Original prompt:
${currentPrompt}

Rules for enhancement:
1. Maximum 500 characters
2. Maintain the original intent and focus
3. Add relevant keywords and details
4. Improve clarity and specificity
5. Format consistently
```

### 4. Database Access

Update or create data access functions to retrieve:
- Subscription type descriptions
- User profile information

## Frontend Implementation

### 1. Update Subscription Form Component

Location: `frontend/src/components/subscriptions/SubscriptionForm.tsx`

Changes:
- Add functionality to the "Mejorar con IA" button
- Add loading state to the button
- Update the prompt textarea when enhancement is received

### 2. Create API Service Function

Location: `frontend/src/api/services/subscription-service.ts`

Add a new function to handle the prompt enhancement API call:

```typescript
export const enhancePrompt = async (params: {
  subscriptionId?: string;
  subscriptionType: string;
  currentPrompt: string;
}): Promise<ApiResponse<{
  enhancedPrompt: string;
  originalPrompt: string;
}>> => {
  try {
    const response = await axiosInstance.post('/api/v1/subscriptions/enhance-prompt', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
```

### 3. Create a Custom Hook

Location: `frontend/src/hooks/use-prompt-enhancement.ts`

Functionality:
- Manage loading state
- Handle API calls
- Provide error handling
- Return enhanced prompts

```typescript
export const usePromptEnhancement = () => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const enhancePrompt = async (params) => {
    setIsEnhancing(true);
    setError(null);
    
    try {
      const response = await subscriptionService.enhancePrompt(params);
      setIsEnhancing(false);
      return response.data;
    } catch (error) {
      setError(error);
      setIsEnhancing(false);
      throw error;
    }
  };
  
  return {
    enhancePrompt,
    isEnhancing,
    error
  };
};
```

### 4. UI Updates

#### Update Button Component

```tsx
<Button
  onClick={handleEnhancePrompt}
  disabled={isEnhancing || !currentPrompt.trim()}
  variant="secondary"
  className="ml-2"
>
  {isEnhancing ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generando...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      Mejorar con IA
    </>
  )}
</Button>
```

#### Add Enhancement Handler

```typescript
const handleEnhancePrompt = async () => {
  if (!currentPrompt.trim()) return;
  
  try {
    const result = await enhancePrompt({
      subscriptionType: subscriptionType,
      currentPrompt: currentPrompt,
      subscriptionId: subscription?.id
    });
    
    // Show the enhanced prompt with an option to accept it
    setEnhancedPrompt(result.enhancedPrompt);
    setShowEnhancementDialog(true);
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo mejorar el prompt. Inténtalo de nuevo.",
      variant: "destructive"
    });
  }
};
```

#### Add Dialog to Accept/Reject Enhanced Prompt

Create a dialog component to display the enhanced prompt and allow the user to accept or reject it:

```tsx
<Dialog open={showEnhancementDialog} onOpenChange={setShowEnhancementDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Prompt Mejorado con IA</DialogTitle>
      <DialogDescription>
        Revisa el prompt mejorado y decide si quieres utilizarlo.
      </DialogDescription>
    </DialogHeader>
    <div className="my-4 p-4 bg-muted rounded-md">
      <p className="whitespace-pre-wrap">{enhancedPrompt}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {enhancedPrompt.length} / 500 caracteres
      </p>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowEnhancementDialog(false)}>
        Cancelar
      </Button>
      <Button onClick={() => {
        setCurrentPrompt(enhancedPrompt);
        setShowEnhancementDialog(false);
      }}>
        Utilizar este prompt
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Communication Protocol

1. **Frontend to Backend:**
   - HTTP POST request to `/api/v1/subscriptions/enhance-prompt`
   - Request includes subscription type, current prompt, user ID, and optionally the subscription ID
   - Request is authenticated using the user's JWT token

2. **Backend Processing:**
   - Validate the request
   - Retrieve subscription type description from the database
   - Retrieve user profile/biography from the database
   - Construct a prompt for Google Gemini AI
   - Call Google Gemini API
   - Process and sanitize the response
   - Return the enhanced prompt to the frontend

3. **Backend to Frontend:**
   - HTTP response with the enhanced prompt
   - Include the original prompt for reference
   - Return appropriate error codes for failures

## Database Requirements

1. **Subscription Types Collection:**
   - Need to access subscription type descriptions

   ```typescript
   // Example query
   const subscriptionType = await db.collection('subscription_types')
     .findOne({ type: params.subscriptionType });
   ```

2. **Users Collection:**
   - Need to access user biography/profile information

   ```typescript
   // Example query
   const userProfile = await db.collection('users')
     .findOne({ id: params.userId }, { projection: { biography: 1 } });
   ```

## Error Handling

1. **Backend Errors:**
   - Invalid request parameters: 400 Bad Request
   - Authentication errors: 401 Unauthorized
   - Subscription type not found: 404 Not Found
   - Google Gemini API errors: 502 Bad Gateway
   - Generic server errors: 500 Internal Server Error

2. **Frontend Error Handling:**
   - Display error toasts for API failures
   - Provide retry options
   - Disable the enhance button during API calls
   - Fall back to manual editing if enhancement fails

## Testing Plan

1. **Backend Unit Tests:**
   - Test prompt enhancement service with different inputs
   - Test Google Gemini API integration with mock responses
   - Test error handling scenarios

2. **Frontend Unit Tests:**
   - Test the prompt enhancement hook
   - Test UI components with different states (loading, error, success)

3. **Integration Tests:**
   - Test the complete flow from button click to displaying the enhanced prompt
   - Test error scenarios and recovery

## Implementation Phases

### Phase 1: Backend Implementation
1. Create the prompt enhancement service
2. Integrate with Google Gemini API
3. Create the API endpoint
4. Add tests

### Phase 2: Frontend Implementation
1. Update the subscription form component
2. Add the prompt enhancement hook
3. Implement the UI for displaying enhanced prompts
4. Add loading states and error handling

### Phase 3: Testing and Refinement
1. Test the complete flow
2. Optimize the prompt template for better results
3. Refine the UI based on feedback

## Conclusion

This implementation will add an AI-powered prompt enhancement feature to the subscription creation/edit pages. The feature will allow users to improve their search prompts using Google Gemini AI, making their subscriptions more effective. 