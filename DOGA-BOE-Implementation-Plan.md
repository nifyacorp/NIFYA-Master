# DOGA Parser Implementation Plan

This document outlines the implementation plan for adapting the BOE Parser codebase to create a DOGA Parser service that follows the same specifications in terms of communications, services, and operations.

## 1. Current State Analysis

### BOE Parser
- **Purpose**: Parses Spanish Official Bulletin (BOE) entries using AI to find relevant information
- **Architecture**: Modular architecture with controllers, services, and middleware
- **Data Source**: BOE XML feed at `https://www.boe.es/datosabiertos/api/boe/sumario/[YYYYMMDD]`
- **AI Integration**: Google Gemini AI for content analysis
- **Communication**: PubSub for publishing analysis results

### DOGA Parser
- **Purpose**: Currently analyzes Diario Oficial de Galicia (DOGA) using OpenAI's GPT-4
- **Architecture**: Simpler structure with basic services
- **Data Source**: DOGA RSS feed at `https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_es.rss`
- **AI Integration**: OpenAI GPT-4
- **Communication**: Currently lacks PubSub integration

## 2. Implementation Goals

1. Standardize the DOGA Parser to match BOE Parser's architecture and communication patterns
2. Maintain consistent endpoint structure and response formats
3. Implement PubSub messaging with identical schema
4. Ensure the DOGA Parser can be used interchangeably with the BOE Parser from the client perspective
5. Adapt the content fetching mechanism to work with DOGA's data source format

## 3. Required Dependencies

Update `package.json` to include these additional dependencies:

```json
{
  "dependencies": {
    "@google-cloud/pubsub": "^4.0.7",
    "@google/generative-ai": "^0.24.0",
    "fast-xml-parser": "^4.3.2",
    "jsdom": "^24.0.0",
    "gpt-tokenizer": "^2.1.2"
  }
}
```

## 4. Directory Structure Changes

Adapt the DOGA Parser to follow the BOE Parser's directory structure:

```
src/
├── index.js                    # Main application entry point
├── config/
│   └── config.js               # Configuration settings
├── controllers/
│   └── analyze.js              # Analysis controller
├── middleware/
│   ├── index.js                # Middleware registration
│   ├── errorHandler.js         # Error handling middleware
│   └── validateRequest.js      # Request validation
├── routes/
│   └── index.js                # Route definitions
├── services/
│   ├── parser/
│   │   ├── index.js            # Parser orchestration
│   │   ├── scraper.js          # DOGA data fetching
│   │   └── textProcessor.js    # Text processing utilities
│   └── ai/
│       ├── index.js            # AI service orchestration
│       ├── gemini.js           # Gemini integration
│       └── prompts/            # AI prompt templates
├── utils/
│   ├── errors/
│   │   └── AppError.js         # Error handling classes
│   ├── logger.js               # Logging utility
│   ├── pubsub.js               # PubSub integration
│   └── schemas/
│       └── pubsubMessages.js   # Schema validation
```

## 5. Code Implementation Plan

### 5.1 Core Application Structure

1. **Main Entry Point** (`src/index.js`)
   - Implement the modular application setup similar to BOE Parser
   - Set up middleware, error handling, and routes

2. **Configuration** (`src/config/config.js`)
   - Add environment variable handling for API keys, PubSub configuration
   - Implement secret loading from Google Secret Manager

3. **Middleware**
   - Add request validation middleware for the analyze endpoint
   - Implement error handling middleware for consistent error responses

### 5.2 Parser Implementation

1. **DOGA Parser Orchestration** (`src/services/parser/index.js`)
   - Create a `parseDOGA` function similar to `parseBOE`
   - Handle data fetching and parsing orchestration

2. **DOGA Scraper** (`src/services/parser/scraper.js`)
   - Adapt the existing scraper to follow BOE's error handling patterns
   - Implement consistent data structure for both parsers

3. **Text Processing** (`src/services/parser/textProcessor.js`)
   - Ensure text processing follows the same patterns

### 5.3 AI Integration

1. **AI Service Orchestration** (`src/services/ai/index.js`)
   - Implement `analyzeDOGAItems` similar to `analyzeBOEItems`
   - Handle content analysis with proper error handling

2. **Gemini Integration** (`src/services/ai/gemini.js`)
   - Replace OpenAI with Gemini to match BOE parser
   - Implement content prompts for DOGA data

### 5.4 PubSub Integration

1. **PubSub Client** (`src/utils/pubsub.js`)
   - Implement identical PubSub functionality
   - Ensure message schema validation

2. **Message Schema** (`src/utils/schemas/pubsubMessages.js`)
   - Use identical schema validation logic
   - Ensure compatibility with notification worker

## 6. API Endpoints

Implement these endpoints to match the BOE Parser:

### 6.1 Primary Endpoints

1. **`POST /analyze-text`**
   - Main endpoint for analyzing DOGA content
   - Same request/response format as BOE
   - Publishes results to PubSub

2. **`POST /test-analyze`**
   - Diagnostic endpoint for testing without PubSub publishing
   - Same request/response format as BOE

### 6.2 Health & Diagnostic Endpoints

1. **`GET /health`**
   - Basic health check endpoint

2. **`GET /check-gemini`**
   - Test connection to Gemini AI

3. **`GET /help`**
   - API documentation endpoint

## 7. PubSub Message Schema

The DOGA Parser will use the same PubSub message schema as the BOE Parser:

```javascript
{
  trace_id: "string", // Required
  request: {
    subscription_id: "string", // Required: Empty string if not available
    user_id: "string",         // Required: Empty string if not available
    texts: []                  // Array of prompts/search texts
  },
  results: {
    doga_info: {
      issue_number: "string",
      publication_date: "YYYY-MM-DD",
      source_url: "https://www.xunta.gal/diario-oficial-galicia"
    },
    query_date: "YYYY-MM-DD",
    results: [
      {
        prompt: "User query 1",
        matches: [
          {
            document_type: "RESOLUTION",
            title: "Original DOGA title",
            notification_title: "Optimized notification title",
            issuing_body: "Issuing organization",
            summary: "Brief summary of relevance",
            relevance_score: 85,
            links: {
              html: "HTML URL",
              pdf: "PDF URL"
            }
          }
        ],
        metadata: {
          processing_time_ms: 1200,
          model_used: "gemini-2.0-flash-lite",
          token_usage: {
            input_tokens: 12000,
            output_tokens: 500,
            total_tokens: 12500
          }
        }
      }
    ]
  },
  metadata: {
    processing_time_ms: 1200,
    total_items_processed: 50,
    status: "success",
    processor_type: "doga"  // Identifies the source parser
  }
}
```

## 8. Implementation Steps

1. **Project Setup & Dependencies**
   - Update package.json and install new dependencies
   - Create the directory structure

2. **Core Structure Implementation**
   - Implement main application, configuration, and middleware

3. **Parser Service Development**
   - Adapt scraper for DOGA RSS feed
   - Implement XML parsing logic

4. **AI Integration Development**
   - Set up Gemini AI integration
   - Create prompt templates for DOGA content

5. **PubSub Integration**
   - Implement PubSub client and message publishing
   - Add schema validation

6. **API Endpoints Implementation**
   - Create controllers and routes for all endpoints
   - Ensure consistent request/response patterns

7. **Testing**
   - Test data fetching with the DOGA RSS feed
   - Test AI analysis with sample DOGA content
   - Test PubSub messaging with the notification worker

8. **Deployment**
   - Update Dockerfile if needed
   - Deploy to Cloud Run

## 9. Differences to Address

1. **Data Source Format**
   - BOE: XML from official API
   - DOGA: RSS feed with different structure

2. **Content Extraction**
   - Adapt extraction logic for DOGA's different document structure
   - Normalize extracted data to match BOE's format

3. **AI Model**
   - Replace OpenAI with Gemini for consistency
   - Adapt prompts for DOGA content

## 10. Testing Plan

1. **Unit Tests**
   - Test data fetching from DOGA RSS
   - Test parsing logic
   - Test AI integration
   - Test PubSub message validation

2. **Integration Tests**
   - Test end-to-end flow from request to PubSub message
   - Test with notification worker

3. **Performance Tests**
   - Compare token usage
   - Measure processing time

## 11. Conclusion

This implementation plan provides a structured approach to adapt the BOE Parser codebase to create a DOGA Parser service with identical specifications. By following this plan, we can ensure that both services provide consistent interfaces and behavior, making them interchangeable from the client perspective while handling their specific data sources appropriately. 