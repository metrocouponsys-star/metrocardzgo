# Metro Cardz — System Architecture Document (Production-Grade)

**Version:** 1.0
**Audience:** Engineering (solo build, DeveloperBee), future hires, technical due-diligence readers (hackathon judges, investors)
**Scope:** End-to-end architecture — infra, data, security, integrations, background processing, deployment, scaling, failure handling.

---

## 1. Architecture Overview

### 1.1 Style: Modular Monolith (not microservices)

At this scale (single founder, MVP-to-early-growth, target of dozens to low-hundreds of merchants in year one), a **modular monolith** is the correct architecture — not microservices. Reasoning to document explicitly, since judges/investors may ask "why not microservices":

- Microservices add network overhead, deployment complexity, and distributed-transaction problems that only pay off past a scale (multiple teams, independent scaling needs per module) you won't hit for years.
- A modular monolith — one deployable codebase, internally organized into clear bounded modules (Auth, Members, Offers, Redemption, Campaigns, Reporting, Admin) — gives you the same code organization benefits without the operational cost.
- Migration path: because modules are internally decoupled (separate service classes, no cross-module direct DB writes), splitting any module into its own service later is a refactor, not a rewrite.

### 1.2 High-Level Diagram (textual)

```
                         ┌─────────────────────┐
                         │   Client (Browser)   │
                         │  Merchant / Admin /   │
                         │  Public Customer Page │
                         └──────────┬───────────┘
                                    │ HTTPS
                         ┌──────────▼───────────┐
                         │   CDN / Reverse Proxy  │  (Nginx / Cloudflare)
                         │  - TLS termination     │
                         │  - Rate limiting        │
                         │  - Static asset caching │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   Application Server   │  (FastAPI, Python)
                         │  ┌─────────────────┐  │
                         │  │ Auth Module      │  │
                         │  │ Members Module   │  │
                         │  │ Offers Module    │  │
                         │  │ Redemption Module│  │
                         │  │ Campaigns Module │  │
                         │  │ Reporting Module │  │
                         │  │ Admin Module     │  │
                         │  └─────────────────┘  │
                         └───┬───────────┬────────┘
                             │           │
                ┌────────────▼──┐   ┌────▼─────────────┐
                │   PostgreSQL    │   │   Redis            │
                │  (primary data) │   │  (cache, sessions,  │
                │                 │   │   rate-limit counters,│
                │                 │   │   job queue backing) │
                └────────────────┘   └────┬───────────────┘
                                           │
                                ┌──────────▼───────────┐
                                │  Background Worker     │  (Celery / RQ)
                                │  - Daily reminder scan  │
                                │  - SMS/WhatsApp dispatch│
                                │  - Report pre-computation│
                                └──────────┬───────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
             ┌───────▼──────┐     ┌────────▼───────┐    ┌────────▼───────┐
             │  SMS Gateway   │     │  WhatsApp BSP   │    │  Object Storage │
             │  (Msg91/Twilio)│     │  (AiSensy/Gupshup)│  │  (card PDFs,     │
             │                │     │                 │    │   logos, exports)│
             └────────────────┘     └────────────────┘    └────────────────┘
```

### 1.3 Core Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (SPA) or server-rendered via FastAPI + Jinja for public pages | Matches your existing stack; SPA for merchant panel, lightweight server-rendered for public self-check page (faster load, no JS bundle needed for a read-only page) |
| Backend API | FastAPI (Python) | Matches your existing stack (IntelliOps), async-native, auto OpenAPI docs |
| Primary DB | PostgreSQL | Relational integrity matters here (financial-adjacent: wallet balances, redemption counts) — not a NoSQL fit |
| Cache/Session/Queue backing | Redis | Session storage, rate-limit counters, Celery broker |
| Background jobs | Celery (or lighter-weight RQ if solo-maintained) | Daily reminder scans, async SMS/WhatsApp dispatch, PDF generation |
| File/object storage | S3-compatible (AWS S3, or DigitalOcean Spaces for lower cost) | Card PDFs, merchant logos, CSV exports |
| Reverse proxy | Nginx or Caddy | TLS termination, rate limiting, gzip |
| Hosting | DigitalOcean Droplet/App Platform (per earlier discussion) | Predictable pricing, matches your budget constraints |

---

## 2. Multi-Tenancy Architecture

This is the single most important non-functional requirement in the entire system, and worth its own section because getting it wrong is a data breach, not a bug.

### 2.1 Model: Shared database, shared schema, row-level tenant isolation

- Every tenant-scoped table carries a `merchant_id` foreign key.
- **Every single query** touching tenant data must filter by `merchant_id` — enforced at the ORM/query-builder layer, not left to individual endpoint discipline.
- Recommended implementation: a query middleware/base repository class that automatically injects `WHERE merchant_id = :current_merchant_id` on every read/write — so a developer (even future-you, six months from now, in a hurry) cannot accidentally write a cross-tenant query.
- Staff/Owner JWT tokens carry `merchant_id` as a claim; every request handler reads tenant scope from the verified token, never from a request parameter (a request parameter can be tampered with; a signed JWT claim cannot).

### 2.2 Why this matters concretely
If `merchant_id` filtering is ever missed on one endpoint, a Salon A staff member could pull Salon B's customer list, phone numbers, and wallet balances. This is the kind of bug that ends a B2B SaaS product's credibility permanently. Treat every new endpoint's tenant-scoping as a mandatory code-review checklist item, not an assumption.

---

## 3. Security Architecture

### 3.1 Authentication
- Merchant Owner/Staff: password or OTP-based login → JWT access token (short-lived, ~15 min) + refresh token (longer-lived, stored HttpOnly cookie, rotated on use)
- Super Admin: same JWT pattern, plus mandatory 2FA (this account has platform-wide blast radius — treat it accordingly)
- Public customer self-check page: **no auth**, but access is gated by knowledge of an unguessable token, not a session

### 3.2 QR Token Design (critical detail flagged earlier — formalized here)
- Member QR encodes an **opaque, non-sequential, signed token** — e.g. a UUID or HMAC-signed short code — never a raw sequential ID like `SAL001`.
- Recommended: `member.public_token = HMAC-SHA256(member.id + merchant.secret_salt)`, truncated/encoded to a short URL-safe string.
- Public self-check page looks up by `public_token`, never by internal `member.id` or sequential `member_code`.
- Internal `member_code` (e.g. `SAL001`, human-readable, printed on card as the fallback manual-entry number) is separate from the QR's actual encoded value if you want defense-in-depth — or, simpler for V1: encode the same human-readable code but require the merchant-side lookup to always go through an authenticated session (so raw enumeration doesn't matter internally), while the **public** self-check page uses the separate unguessable token. This distinction matters: internal lookups are protected by merchant auth; public lookups are protected only by token secrecy, so the public-facing one must never be sequential.

### 3.3 Data Protection
- All traffic over HTTPS/TLS — no exceptions, including internal admin tools.
- Passwords: bcrypt/argon2 hashed, never reversible.
- PII at rest (phone numbers, names, DOB): encrypted at the database column level if hosting provider doesn't already encrypt at rest (most managed Postgres does disk-level encryption by default — verify with your chosen provider, e.g. DigitalOcean Managed DB encrypts at rest by default).
- Rate limiting on all public/auth endpoints (Redis-backed) to prevent brute-force login attempts and token-enumeration attacks against the public self-check page.

### 3.4 Audit Logging
- Every redemption action logs: which staff account, which member, which offer, timestamp, IP address.
- Every admin impersonation ("login as merchant" for support) is logged separately and should be visible to the merchant (transparency — a merchant should be able to see if/when Metro Cardz support accessed their account).

---

## 4. Detailed Data Model

```sql
merchants (
  id UUID PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT,
  plan_tier TEXT,
  whatsapp_number TEXT,
  secret_salt TEXT,          -- used for token signing, never exposed
  status TEXT DEFAULT 'active', -- active/suspended
  created_at TIMESTAMPTZ DEFAULT now()
)

merchant_users (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  name TEXT,
  phone TEXT,
  role TEXT,                 -- owner/staff
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

membership_types (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  name TEXT,                 -- e.g. 'Prime'
  description TEXT
)

members (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  member_code TEXT,          -- human-readable, e.g. SAL001
  public_token TEXT UNIQUE,  -- opaque, used in QR + public URL
  name TEXT,
  phone TEXT,
  date_of_birth DATE,
  anniversary_date DATE,
  membership_type_id UUID REFERENCES membership_types(id),
  joined_date DATE,
  expiry_date DATE,
  loyalty_points NUMERIC DEFAULT 0, -- renamed from wallet_balance
  status TEXT DEFAULT 'active', -- active/expired/deactivated
  created_at TIMESTAMPTZ DEFAULT now()
)

offer_templates (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  title TEXT,
  description TEXT,
  offer_type TEXT,           -- percent_off/free_service/wallet_points/referral/birthday/points_redemption
  value NUMERIC,
  active BOOLEAN DEFAULT true,
  loyalty_points_earn NUMERIC NULL,   -- points earned per redemption
  is_points_redemption BOOLEAN DEFAULT false, -- if true, this is a reward purchased with points
  loyalty_points_cost NUMERIC NULL    -- points cost to redeem this reward
)

loyalty_transactions (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  merchant_id UUID REFERENCES merchants(id),
  type TEXT,                 -- 'earn' or 'redeem'
  points NUMERIC,            -- positive for earn, negative for redeem
  source_redemption_id UUID REFERENCES redemption_log(id) NULL,  -- what earned it
  source_offer_id UUID REFERENCES offer_templates(id) NULL,       -- what redeemed it
  balance_after NUMERIC,     -- running balance snapshot for audit
  created_at TIMESTAMPTZ DEFAULT now()
)

membership_type_offers (   -- many-to-many: which offers bundle into which membership type
  membership_type_id UUID REFERENCES membership_types(id),
  offer_template_id UUID REFERENCES offer_templates(id),
  PRIMARY KEY (membership_type_id, offer_template_id)
)

member_offer_state (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  offer_template_id UUID REFERENCES offer_templates(id),
  remaining_qty NUMERIC,     -- null if not quantity-limited (e.g. % discounts)
  status TEXT DEFAULT 'active'
)

redemption_log (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  offer_template_id UUID REFERENCES offer_templates(id),
  merchant_user_id UUID REFERENCES merchant_users(id),
  amount NUMERIC,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

reminder_rules (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  trigger_type TEXT,         -- birthday/anniversary/loyalty_threshold/expiry
  channel TEXT,              -- sms/whatsapp
  template_text TEXT,
  threshold_value NUMERIC,   -- for loyalty_threshold type
  active BOOLEAN DEFAULT true,
  send_time TIME,            -- what time of day to send (e.g., '09:00:00')
  days_before INTEGER,       -- how many days in advance to send
  timezone TEXT DEFAULT 'Asia/Kolkata' -- time zone for scheduled dispatch
)

campaigns (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  name TEXT,
  target_audience TEXT,      -- all/by_membership_type/expiring_soon
  channel TEXT,
  template_text TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- draft/scheduled/sent
  created_at TIMESTAMPTZ DEFAULT now()
)

message_log (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  campaign_id UUID REFERENCES campaigns(id) NULL,
  reminder_rule_id UUID REFERENCES reminder_rules(id) NULL,
  channel TEXT,
  status TEXT,               -- sent/failed/delivered
  sent_at TIMESTAMPTZ DEFAULT now()
)

admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID,
  merchant_id UUID REFERENCES merchants(id),
  action TEXT,               -- e.g. 'impersonate_login', 'suspend_merchant'
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Indexing notes:**
- Index `members(merchant_id, phone)` — this is the hottest query path (mobile number search).
- Index `members(public_token)` — hottest query for public self-check page.
- Index `redemption_log(member_id, created_at)` — for member history and reporting.
- Composite index `members(merchant_id, expiry_date)` — for expiry-reminder daily scans.

---

## 5. Core Flows (Detailed Sequence)

### 5.1 Redemption Flow (critical path — must be fast and safe)

```
1. Staff logs in → JWT issued with merchant_id claim
2. Staff searches member (mobile/membership no./QR)
   → API: GET /members/search?query=X
   → Server validates merchant_id from JWT, scopes query
   → Returns member profile + active offers + member_offer_state
3. Staff selects offer → clicks Redeem
   → Client shows confirmation modal (before/after balance preview)
4. Staff confirms
   → API: POST /redemptions
   → Server validates:
     a. member belongs to requesting merchant_id (tenant check)
     b. offer_template belongs to same merchant_id
     c. member_offer_state.remaining_qty > 0 (or offer type doesn't require qty check)
     d. member.status == 'active' and expiry_date >= today
   → If all pass: DECREMENT remaining_qty (atomic transaction), INSERT redemption_log row
   → If any fail: return specific error (expired/insufficient balance/not found)
5. Client shows success toast, refreshes member profile view
```

**Critical implementation detail:** step 4's decrement-and-log must be a single atomic database transaction (not two separate calls), to prevent race conditions — e.g. two staff members redeeming the same "last remaining" offer simultaneously on two devices. Use `SELECT ... FOR UPDATE` or an atomic `UPDATE ... WHERE remaining_qty > 0 RETURNING` pattern to prevent overdraw.

### 5.2 Automated Reminder Flow (daily batch job)

```
1. Cron trigger (once daily, e.g. 8 AM IST — matches when merchants/customers are likely to see messages)
2. Worker queries, per merchant, per active reminder_rule:
   - birthday: SELECT members WHERE date_of_birth's month/day = today AND merchant reminder active
   - anniversary: same pattern on anniversary_date
   - expiry: SELECT members WHERE expiry_date - today = N days (configurable, e.g. 7 days before)
   - loyalty_threshold: SELECT members WHERE wallet_balance crossed threshold since last check
     (requires tracking last-checked balance or a separate "threshold_crossed_at" flag to avoid re-firing daily)
3. For each matching member: render template_text with placeholders ({name}, {offer}, {business_name})
4. Dispatch to channel (SMS via gateway API call, or WhatsApp via BSP API call)
5. Log result to message_log (sent/failed)
6. Failed sends retried once after a delay; permanent failures flagged for merchant visibility in dashboard
```

### 5.3 One-Time Campaign Flow (merchant-triggered)

```
1. Merchant creates campaign (audience, message, channel, schedule)
2. If "Send Now": job enqueued immediately to background worker
3. If "Schedule for date": stored with scheduled_at, picked up by the same daily cron sweep
4. Worker resolves target_audience → member list (all / by type / expiring soon)
5. Batches dispatch (rate-limited to respect SMS/WhatsApp provider throughput limits —
   e.g. don't fire 5,000 messages in one burst; batch in chunks of 50-100 with small delays)
6. Campaign status updated: draft → scheduled → sending → sent
7. Delivery stats aggregated into campaigns table for merchant visibility
```

### 5.4 New Member Enrollment Flow

```
1. Merchant/staff submits new member form
2. Server generates: member_code (sequential, human-readable, merchant-scoped e.g. SAL00N),
   public_token (HMAC-signed opaque string)
3. member_offer_state rows auto-created for every offer bundled in the selected membership_type
4. Optional: welcome SMS/WhatsApp dispatched immediately (not batched — this is a real-time trigger, not part of the daily sweep)
5. Card PDF generation triggered (async job) → stored in object storage → download link returned to merchant
```

### 5.5 Merchant Suspension Flow (Admin action)

```
1. Super Admin clicks Suspend on a merchant
2. merchants.status → 'suspended'
3. All merchant_users of that merchant immediately lose API access (middleware checks merchant.status on every request, not just at login — so an already-logged-in staff session is also cut off, not just blocked at next login)
4. Public self-check pages for that merchant's members show a generic "temporarily unavailable" message (not an error that reveals suspension reason)
5. Action logged to admin_audit_log
```

---

## 6. Background Job & Queue Architecture

- **Queue:** Redis-backed Celery (or RQ for simpler solo maintenance).
- **Job types:**
  - `daily_reminder_scan` — scheduled, runs once/day
  - `dispatch_message` — one job per individual SMS/WhatsApp send (allows retry per-message without re-running the whole batch)
  - `generate_card_pdf` — triggered on-demand per member/batch
  - `precompute_reports` — optional, nightly job to pre-aggregate heavy report queries so the Reports screen loads instantly instead of running expensive queries live
- **Retry policy:** exponential backoff, max 3 attempts, dead-letter logging for anything that fails permanently (visible to you as the platform operator, and surfaced to the merchant for message failures specifically).

---

## 7. Deployment & CI/CD

```
Developer pushes to main branch
        │
        ▼
GitHub Actions (or similar CI)
  - Run linter
  - Run test suite (unit + integration)
  - Build Docker image
        │
        ▼
Push image to registry (GitHub Container Registry / DO Container Registry)
        │
        ▼
Deploy to staging environment → smoke test
        │
        ▼
Manual approval gate (solo dev — this is just you clicking "deploy to prod")
        │
        ▼
Deploy to production (rolling restart, zero-downtime if using 2+ app instances;
acceptable brief downtime if single-instance at MVP stage)
```

**Environments:** local dev → staging (mirrors prod, used for testing card printing/SMS templates without spamming real customers) → production.

**Migrations:** managed via Alembic (Python/FastAPI ecosystem standard), run as a pre-deploy step, never manually against production.

---

## 8. Observability & Monitoring

| Concern | Tool/approach |
|---|---|
| Error tracking | Sentry (free tier sufficient at this scale) |
| Uptime monitoring | UptimeRobot or Better Uptime (free/cheap tier) — alerts you if the login/redemption endpoint goes down |
| Application logs | Structured JSON logs, shipped to a lightweight log aggregator (or just persisted to disk + rotated, at MVP scale) |
| Database health | Provider's built-in monitoring (DO/Supabase dashboards) — CPU, connections, slow queries |
| Message delivery monitoring | `message_log` table itself is your dashboard — surfaced in a merchant-facing "delivery status" view for transparency |

---

## 9. Scaling Considerations (for when it's needed — not now)

- **Vertical first:** upgrade DB/app server tier before considering horizontal scaling — simplest lever, matches your DO-based hosting choice.
- **Read replicas:** only relevant once reporting queries start impacting redemption-flow performance — add a read replica for the Reports module specifically, keep writes on primary.
- **Horizontal app scaling:** once a single app server can't handle load, run 2+ stateless app instances behind the load balancer — safe because JWT auth means no server-side session affinity required.
- **Database partitioning:** `redemption_log` and `message_log` are your fastest-growing tables — if you ever reach genuinely large scale (thousands of merchants, millions of redemptions/year), these are the first candidates for time-based partitioning. Not a concern for years at your target segment's realistic scale.

---

## 10. Disaster Recovery

- **Backups:** daily automated backups via managed DB provider (DO Managed Postgres includes this), retained minimum 7 days, ideally 30.
- **Point-in-time recovery (PITR):** enabled if provider supports it (DO and Supabase both do) — allows restoring to any point within the retention window, not just the last nightly snapshot.
- **Recovery Time Objective (RTO):** realistic target for a solo-operated platform at this stage — a few hours, not minutes. Document this honestly rather than over-promising to merchants.
- **Recovery Point Objective (RPO):** matches backup frequency — up to 24 hours of data loss in worst case with daily backups; tighter if PITR is enabled (near-zero).

---

## 11. Third-Party Integration Summary

| Integration | Purpose | Failure handling |
|---|---|---|
| SMS Gateway (Msg91/Twilio) | OTP, reminders, campaign SMS | Retry once, log failure, fall back to no-op (don't block core redemption flow on SMS failure) |
| WhatsApp BSP (AiSensy/Gupshup) | Same, richer format | Same retry pattern; template rejection handled by falling back to SMS if configured |
| Object Storage (S3/DO Spaces) | Card PDFs, logos, exports | If unavailable, card generation queued for retry; does not block redemption flow (completely separate code path) |

**Critical design principle:** no third-party integration failure should ever block the core redemption flow. Redemption must work even if SMS/WhatsApp/storage is down — those are enhancement layers, not dependencies of the core loop.

---

## 12. What "Production-Ready" Means Here (honest scoping)

For a solo-built MVP targeting dozens of merchants, "production-ready" means:
- Tenant isolation is airtight (Section 2) — non-negotiable, this is the one thing that cannot ship with a bug.
- Redemption flow is atomic and race-condition-safe (Section 5.1) — non-negotiable, this is your core value proposition working correctly.
- Backups exist and have been tested at least once (a backup you've never restored from is not a real backup).
- Core flow (login → search → redeem) does not depend on any third-party service being up.

It does **not** need, at this stage: multi-region deployment, Kubernetes, microservices, 99.99% uptime SLAs, or dedicated on-call rotation. Over-building infrastructure maturity before you have paying merchants is itself a risk — it's time spent that could go into onboarding merchants and validating the product.
