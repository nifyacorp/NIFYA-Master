# Token Counter – Implementation Plan

> **Goal**  Add complete visibility into OpenAI / Gemini token consumption per subscription, per user and per day.  
> The feature must span backend (database + services + Pub/Sub), admin API and frontend admin dashboard.

---

## 1  High-level Requirement

* Persist `input_tokens` (prompt) and `output_tokens` (completion) for every subscription processing run.
* Aggregate these numbers to answer:
  * total tokens consumed today / yesterday / last 30 days
  * per user and per subscription breakdown
* Show real-time metrics in the admin panel:  
  **a)** a new *Token Counter* section in the sidebar,  
  **b)** quick KPIs on *Admin Dashboard* (total today, rolling 7 days),  
  **c)** extended table inside *Processing* view (extra two columns).

---

## 2  Database Schema

Table `subscription_processing` (already central for run bookkeeping) gains two numeric columns:

```sql
ALTER TABLE subscription_processing
  ADD COLUMN IF NOT EXISTS input_tokens  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER NOT NULL DEFAULT 0;
```

* **Rationale** Tokens naturally belong to the single run record; aggregated queries remain trivial.
* **Indexing** not required – queries will filter by `last_run_at` timestamp, not by token columns.
* Migration placed in `backend/supabase/migrations/20250600000004_add_tokens_to_subscription_processing.sql`.

---

## 3  Pub/Sub Contract Changes

All parser-to-notification messages must now embed the two counters.

### 3.1 Parser Response (HTTP & Pub/Sub)

```ts
interface ParserResponse {
  …existing fields…
  usage?: {
    input_tokens:  number; // aka prompt_tokens
    output_tokens: number; // aka completion_tokens
  };
}
```

* Parsers compute the values using provider-specific metadata (e.g. `openai.usage` or Gemini's `usageMetadata`).
* Both the immediate HTTP **response** to `subscription-worker` *and* the **Pub/Sub payload** sent downstream MUST include the `usage` object.

---

## 4  Service Modifications

### 4.1 Parser Services (`*_parser`)

* Collect token metrics after every LLM call.
* Sum across calls within a single request (some parsers chunk input).
* Attach the `usage` object to the final JSON.

Key files to update per service:
```
src/controllers/analyze.js        // gather usagesrc/utils/openai-client.js        // expose usage
src/utils/gemini-client.js        // expose usage
```

### 4.2 subscription-worker

* Expect `usage` inside parser HTTP response.
* When present, update `subscription_processing.input_tokens` & `output_tokens` **in the same UPDATE** that currently sets `status`, `last_run_at`, etc.
* Fallback to zeros if field missing (for backward compatibility while parsers roll out).

### 4.3 notification-worker

* No change required – token counters not used here.

### 4.4 Admin Backend (Core API)

* Expose new endpoint: `GET /api/v1/admin/tokens/summary` returning aggregated stats with optional filters (`date_from`, `date_to`, `user_id`).
* Update existing `/subscription-processing` serializer to include the two token fields.

---

## 5  Frontend Changes (Admin Panel)

| Area | Change |
|------|--------|
| `api/admin/types.ts` | add `input_tokens`, `output_tokens` to `SubscriptionProcessingRecord` + define `TokenSummary` interface |
| `api/admin/subscriptionProcessing.ts` | already passes through fields – nothing extra |
| `components/admin/SubscriptionProcessingTable.tsx` | add two columns *Input Tokens* / *Output Tokens* |
| `components/admin/AdminSidebar.tsx` | add new menu entry *Token Counter* (link `/admin/tokens`) |
| `pages/admin/TokenCounter.tsx` | new page with:<br>• KPI cards (today / 7 days / 30 days)<br>• Bar chart per day (last 14 days)<br>• Table per user (sortable) |
| `pages/admin/Dashboard.tsx` | show mini KPI (tokens today) |

Charts use existing shadcn + recharts infra used by other stats.

---

## 6  Deployment & Roll-out

1. **DB Migration** – apply via Supabase migration pipeline.
2. Deploy each parser service → ensure new field populated.
3. Deploy `subscription-worker` → start writing tokens.
4. Deploy backend API → exposes summary endpoint.
5. Deploy frontend `frontend/` → admin panel updates.

Backward compatibility: old parsers will simply produce zeros until redeployed.

---

## 7  Testing Plan

* Unit tests for token aggregation SQL queries.
* Integration test invoking parser stub returning known token counts; assert DB row updated.
* End-to-end Cypress script hits admin UI and verifies numbers match seeded data.

---

## 8  Open Questions (updated)

| # | Topic | Current Decision / Clarification |
|---|-------|---------------------------------|
| 1 | **Partial runs** | Each `subscription_processing` row represents **one execution per subscription**. A single run may involve multiple parser calls; these are summed **inside the parser** before the response is sent. The aggregated totals are stored in the row. |
| 2 | **Retry logic** | We **double-count tokens** on every retry because the provider still charges us. Implementation: if subscription-worker retries, it will either (a) insert a fresh `subscription_processing` row with status `retry` or (b) keep the same row and **increment** `input_tokens` / `output_tokens`. (A) offers cleaner history – preferred. |
| 3 | **Cost tracking** | Performed **on the frontend only**. Dashboard multiplies tokens by a configurable "price per 1K tokens" value (set via runtime var). No price is stored in the DB so switching model prices requires only a frontend change. |
| 4 | **Data retention** | **No** – keep indefinite retention for now; archival/TTL will be revisited in a future phase. |
| 5 | **User quota enforcement** | **No** – quota limits and alerts are out of scope for the initial release. |
| 6 | **Model differentiation** | **No** – we won't track model IDs or varying costs in phase 1. |

_If new questions arise, append them to this table._

---

*Author: AI assistant* – *2025-05-28* 