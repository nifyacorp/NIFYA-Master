# Relevance Score Propagation – Implementation Plan

> Status: **DRAFT / NOT IMPLEMENTED** – this document defines the required work; no code has been changed.
>
> Goal: surface the AI-generated `relevance_score` (0-100) in every stage of the pipeline so that users can sort/filter notifications by importance.

---

## 1. Current State (as of May 2025)

| Layer | File(s) | `relevance_score` Handling |
|-------|---------|---------------------------|
| **boe-parser** | `src/utils/pubsub.js::transformMatches()` | Already attaches `match.relevance_score` (number) when present. |
| **Pub/Sub Message** | `BoeParserResultMessage` schema | Field **exists** at `results[…].matches[…].relevance_score`. |
| **notification-worker** | `src/services/parser.js::createNotificationsFromMessage()` | Reads `match.relevance_score` ➜ includes it inside `metadata` but **does not** persist to `notifications.relevance_score` column. |
| **subscription-worker** | `src/services/SubscriptionService.js::_handleNotifications()` | Persists notifications **via internal repository**; currently ignores `relevance_score` column. |
| **Database** | `notifications.relevance_score NUMERIC(5,2)` (present in `new_schema.sql`) | Column created, default 0, but seldom populated. |
| **Frontend** | (Out of scope) | Not yet displaying score. |

Conclusion: **Schema is sufficient**; missing work involves repositories & DTOs.

---

## 2. Functional Requirements

1. Persist `relevance_score` (0–100, decimals allowed) in every new notification row.
2. Expose the score in API responses from subscription-worker / notification-worker if applicable.
3. Ensure backward compatibility – legacy messages with no score default to 0.
4. No breaking schema changes; migrations not required.

---

## 3. Work Breakdown

### 3.1 boe-parser – (✔ already ok)
- [ ] Confirm `analyzeBOEItems()` always supplies `relevance_score`.
- [ ] Add sanity default (0) if model omits the field.

### 3.2 Pub/Sub Contract – (✔ already ok)
- [ ] Update shared schema docs to mark `relevance_score` as *recommended*.

### 3.3 notification-worker
1. **Repository layer**
   - [ ] `services/notification.js::createNotification()` ⇒ add `relevance_score` parameter and include in `INSERT`.
2. **Parser consumer**
   - [ ] `createNotificationsFromMessage()` ⇒ pass `match.relevance_score` to repository.
3. **API / DTOs**
   - [ ] If any REST endpoints expose notification objects, include `relevance_score`.
4. **Unit tests**
   - [ ] Extend `test-notification-processor.js` to assert score persistence.

### 3.4 subscription-worker
Although notification persistence is mainly handled by notification-worker, the orchestrator creates its *own* notification rows when running in mock-DB mode. We should:
- [ ] Update `notificationRepository.createNotification()` signature & SQL to accept `relevance_score`.
- [ ] Propagate `match.relevance_score` in `_handleNotifications()`.

### 3.5 Data Backfill (optional)
- [ ] Write one-off SQL script to compute missing scores (set to 0) for historical rows to avoid NULLs.

---

## 4. Risk & Compatibility

* Low risk – uses existing column.
* Message schema already tolerant of absent score.
* Services that ignore the column will continue functioning.

---

## 5. Acceptance Criteria

- New notifications carry the `relevance_score` column populated (>0 for at least 90 % of BOE matches in staging test).
- End-to-end test passes: score propagates from parser → Pub/Sub → DB row.
- No failing unit/integration tests.

---

## 6. Timeline & Ownership

| Task | Owner | ETA |
|------|-------|-----|
| Update notification-worker code & tests | Backend / Andres | ☐ T+1 day |
| Update subscription-worker repository | Backend / Andres | ☐ T+1 day |
| Deploy & verify in staging | DevOps | ☐ T+2 days |
| Frontend sorting/filtering (separate ticket) | Frontend team | — |

---

*End of plan – do not implement until approved.* 