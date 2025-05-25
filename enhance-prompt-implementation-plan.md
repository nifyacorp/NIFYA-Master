## Enhance-Prompt Feature – Implementation Plan

Author: AI Assistant – Date: <!-- fill in date automatically via CI -->

### 1. Problem Statement
Users often enter very short or poorly-structured prompt texts when they create a subscription. A dedicated "Enhance Prompt" button in the frontend should call a backend endpoint that returns:
1. An improved prompt (string) tailored to the chosen subscription type.
2. Zero or more follow-up questions that could help refine the subscription.

Currently the request goes to `/api/v1/subscriptions/enhance-prompt` and receives HTTP 500 because no business logic exists downstream.

### 2. High-Level Architecture
```text
                Frontend (React)
                      │
      POST  /api/v1/subscriptions/enhance-prompt
                      │
               Backend (API-Gateway)
                      │  (1) Validate auth & basic schema
           Fire-and-forget Pub/Sub message «ENHANCE_PROMPT_REQUEST»
                      │
          Subscription-Worker (Cloud Run / PubSub)
                      │  (2) Route by subscriptionType
          ┌───────────┴─────────────┐
          │                         │
       BOE-Parser              DOGA-Parser  … (others)
          │                         │
 (3) Fetch cached recent docs     (3) Fetch cached recent docs
          │                         │
          └───────────┬─────────────┘
                      │
            Prompt-Builder Service (shared)
                      │  (4) Compose GPT prompt
                Vertex AI / OpenAI
                      │  (5) Return enhanced prompt & Qs
                      │
       Subscription-Worker ──► Pub/Sub «ENHANCE_PROMPT_RESPONSE»
                      │
               Backend subscribes & responds via
              HTTP Streaming / temporary cache
                      │
                Frontend receives final JSON
```

### 3. Data Contracts
1. **Request (`EnhancePromptRequest`)**
```jsonc
{
  "subscriptionType": "boe",          // enum
  "draftPrompt": "…",                 // user input
  "userId": "auth-uid-123",          // injected from token
  "language": "es"                    // optional, defaults to 'es'
}
```
2. **Response (`EnhancePromptResponse`)**
```jsonc
{
  "enhancedPrompt": "…",              // final prompt ready to save
  "followUpQuestions": [              // optional Qs to display
    "¿Deseas acotar la comunidad autónoma?",
    "¿Qué palabras clave son prioritarias?"
  ]
}
```

### 4. Task Breakdown by Repository
1. **backend**
   • Add `POST /api/v1/subscriptions/enhance-prompt` controller.
   • Publish Pub/Sub message «ENHANCE_PROMPT_REQUEST» and immediately return `202 Accepted` with a `requestId`.
   • Expose `GET /api/v1/subscriptions/enhance-prompt/{requestId}` for polling until worker stores result in Firestore/Redis.
2. **subscription-worker**
   • Consume «ENHANCE_PROMPT_REQUEST».
   • Switch‐case by `subscriptionType` to decide parser endpoint.
   • Aggregate recent source documents (last 10 items) via parser REST (already cached in each parser).
   • Call shared `prompt-builder` util (new internal lib) to craft LLM prompt.
   • Send to Vertex AI Chat (model: `gpt-4o`, temperature 0.7).
   • Persist `EnhancePromptResponse` keyed by `requestId` and publish «ENHANCE_PROMPT_RESPONSE».
3. **parsers (boe-parser, doga-parser, eu-parser, …)**
   • Add internal REST `GET /recent` returning last 10 parsed JSON entries (already stored in DB).
   • Optionally expose `POST /enhance-prompt` for direct use (future-proof).
4. **frontend**
   • Await `202` then poll `/enhance-prompt/{requestId}` every 1s until ready.
   • Display enhanced prompt + dynamic Qs UI.

### 5. Security & Quotas
• Only authenticated users may request enhancement (verify Firebase JWT).
• Rate-limit: max 5 requests/min/user (Cloud Armor).
• Cost guardrail: token estimate × 5 — fallback to gpt-3.5 if > `$0.05`.

### 6. Fallback Strategy
If worker fails or model error, backend will return HTTP 424 with error message so UI can revert to original prompt.

### 7. Acceptance Criteria
1. Button returns enhanced prompt within 5 seconds p95.
2. `subscription-service.ts:546` receives status 200 with proper payload.
3. Unit & e2e tests in `subscription-worker` mocking parsers & LLM.

---

> NOTE: This document is design-only; no code has been modified yet. 