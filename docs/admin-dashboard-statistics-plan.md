# Admin Dashboard Aggregated Statistics – **Backend-Driven** Implementation Plan (Final)

## 1. Objective
Deliver reliable, low-latency metrics (tokens, emails, notifications, subscriptions, subscription types, users, …) on the admin dashboard while keeping logic in our Node/Fastify backend and leaving physical database changes to DBA operations.

## 2. Key Points
1. **Single aggregation table** (`admin_statistics`) will hold cumulative counters in one row (primary-key `'global'`).
2. **Backend recompute routine** runs COUNT queries in parallel, then UPSERTs the totals to that table.
3. **No SQL migrations committed here** – the DBA will create/alter tables and indexes separately.
4. **Refresh triggers**:   
   • Daily Cloud Scheduler HTTP job   
   • Optional "Refresh stats" button in the admin UI   
   • Manual cURL by admins for ad-hoc updates.
5. **API surface remains unchanged** for reads; a new secured endpoint triggers the recompute.

## 3. Data Model (conceptual)
| Column | Description |
|--------|-------------|
| id | Constant `'global'` primary key |
| total_tokens | Sum of token usage across all users |
| total_notifications | Total notifications generated |
| total_emails | Emails successfully sent |
| total_subscriptions | Active + inactive subscriptions |
| total_subscription_types | Number of subscription type definitions |
| total_users | Registered user accounts |
| refreshed_at | Timestamp of last successful refresh |

*Exact DDL will be provided/applied by the DBA.*

## 4. Backend Changes
1. **Controller method `recomputeAdminStats`** (to be implemented):
   • Issue six COUNT/SUM queries concurrently.  
   • Wrap UPSERT of the results in a single transaction.  
   • Return `{ success: true, refreshed_at }` payload.
2. **Endpoints**
   • `GET /api/v1/admin/dashboard/stats` → returns current row from `admin_statistics`.  
   • `POST /api/v1/admin/dashboard/stats/recompute` → invokes controller; admin auth required.
3. **Feature flag** `USE_AGGREGATED_STATS` allows fallback to legacy live counts until fully vetted.

## 5. Front-End Adjustments
1. Dashboard fetches metrics via a single call `getDashboardStats()`.  
2. Remove individual `count*` API calls and spinners.  
3. (Optional) Add "Refresh stats" button that calls recompute endpoint, then refetches data.  
4. Display `refreshed_at` as a tooltip or small caption for transparency.

## 6. Refresh & Monitoring Strategy
| Mechanism | Details |
|-----------|---------|
| Daily Cron | Cloud Scheduler hits recompute endpoint at 02:30 UTC (configurable). |
| Manual UI | Admin-only button triggers recompute on demand. |
| Alerting  | Cloud Monitoring alert if `refreshed_at` older than 24 h. |

## 7. Migration / Roll-out Steps (no SQL committed)
1. **DBA** creates `admin_statistics` table and initial row.  
2. Implement `recomputeAdminStats` logic + new POST endpoint.  
3. Add Cloud Scheduler job.  
4. Switch front-end to aggregated endpoint.  
5. Monitor error logs & query times; flip feature flag off when satisfied.  
6. Remove deprecated count endpoints in a subsequent clean-up.

## 8. Timeline & Effort
| Task | Est. |
|------|------|
|Backend controller & endpoint | 0.5 d |
|Front-end refactor            | 0.5 d |
|Cloud Scheduler setup         | 0.25 d |
|QA & buffer                   | 0.25 d |
|**Total**                     | **1.5 days** |

*All database DDL/DML scripts will be executed manually by the DBA; code repository will only contain application-level logic.*

---
**Decision Points**
1. Cron frequency – daily sufficient? could be hourly if needed.
2. Whether to expose manual refresh in UI.

Let me know if this lighter approach matches expectations; we can refine further if needed. 