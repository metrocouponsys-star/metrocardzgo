# Metro Cardz — Technical Architecture Document

**Version:** 1.0
**Stack:** Next.js + MySQL + Prisma + Tailwind, deployed on Hostinger Web App Hosting

---

## 1. System Overview

Single Next.js application handling both public-facing pages and the admin panel, backed by one MySQL database. No microservices — traffic and complexity don't justify splitting services at this stage.

```
┌──────────────────────────────────────────────────────┐
│                   Hostinger Web App                    │
│                                                          │
│   ┌────────────────┐        ┌────────────────────┐    │
│   │  Next.js Pages   │       │  Next.js API Routes │    │
│   │  (public + admin)│◄─────►│  /api/*              │    │
│   └────────────────┘        └──────────┬──────────┘    │
│                                          │                │
│                              ┌───────────▼──────────┐    │
│                              │   Prisma ORM Client    │    │
│                              └───────────┬──────────┘    │
└──────────────────────────────────────────┼───────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │  MySQL (Hostinger-managed) │
                              └────────────────────────────┘
```

---

## 2. Folder Structure

```
metro-cardz/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── go/page.tsx                  # NFC landing
│   │   ├── category/[slug]/page.tsx
│   │   ├── deal/[id]/page.tsx
│   │   ├── live-offers/page.tsx
│   │   ├── my-card/page.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── deals/page.tsx
│   │   │   ├── deals/new/page.tsx
│   │   │   ├── deals/[id]/edit/page.tsx
│   │   │   └── brands/page.tsx
│   │   └── api/
│   │       ├── deals/route.ts
│   │       ├── deals/[id]/route.ts
│   │       ├── categories/route.ts
│   │       ├── cities/route.ts
│   │       ├── admin/deals/route.ts
│   │       └── admin/auth/route.ts
│   ├── components/
│   │   ├── DealCard.tsx
│   │   ├── CategoryTile.tsx
│   │   ├── PartnerBadge.tsx
│   │   └── CityFilter.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── partnerStatus.ts             # centralized badge/CTA logic
│   └── styles/
│       └── globals.css
├── .env
├── next.config.js
├── package.json
└── tailwind.config.js
```

---

## 3. Environment Variables

```
DATABASE_URL="mysql://user:password@host:3306/metrocardz"
NEXTAUTH_SECRET="<generate-random-secret>"
NEXTAUTH_URL="https://metrocardz.in"
ADMIN_SESSION_MAX_AGE=86400
```

---

## 4. Request Flow — Public Deal Browsing

1. User taps NFC → GET `metrocardz.in/go`
2. Next.js serves statically generated category grid (ISR, revalidate every 6h)
3. User taps "Water Parks" → GET `/category/waterparks`
4. Page calls `/api/deals?category=waterparks` server-side (or client fetch for city filter changes)
5. API route queries via Prisma: `deals` joined to `brands` where `category_id = X AND active = true`
6. User selects city → client-side fetch to `/api/deals?category=waterparks&city=lonavala`, re-renders grid without full page reload
7. User taps a deal card → GET `/deal/[id]`
8. Page renders offer detail, terms, partner badge (derived from `partnerStatus.ts` logic)
9. User taps "Book Now" → GET `/api/redirect/[id]` (server route) → looks up `booking_url` or `affiliate_url`, appends tracking params if affiliate, issues 302 redirect to external site

**Why route the redirect through an API endpoint instead of a plain `<a href>`:** it lets you log click-through events (for FR analytics) and centrally control affiliate parameter injection without touching frontend code per-brand.

---

## 5. Request Flow — Admin CRUD

1. Admin visits `/admin/login`, submits credentials → POST `/api/admin/auth`
2. Server validates against `admin_users.password_hash` (bcrypt), issues session/JWT cookie
3. Admin visits `/admin/deals` → protected route, middleware checks session, GET `/api/admin/deals` returns full list (including inactive)
4. Admin creates/edits a deal → form submits POST/PUT `/api/admin/deals` or `/api/admin/deals/[id]`
5. Server-side validation (not just client-side):
   - `partner_status` required
   - if `AFFILIATE`, `affiliate_url` required
   - `end_date >= start_date`
6. On save, Prisma writes to `deals` table; public pages reflect the change on next request (ISR revalidation or direct DB read if using SSR for deal pages)

---

## 6. Caching Strategy

| Page | Strategy | Reason |
|---|---|---|
| `/go` (category grid) | ISR, revalidate 6h | Categories rarely change |
| `/category/[slug]` | ISR, revalidate 1h | Deals change moderately often |
| `/deal/[id]` | SSR (no cache) or ISR 30min | Needs freshness for active/expired status |
| `/live-offers` | ISR, revalidate 30min | Curated, changes when admin flips `featured` |
| `/admin/*` | No cache, always SSR | Must reflect real-time DB state |

---

## 7. Security Considerations

- Admin routes protected via middleware — verify session on every `/admin/*` and `/api/admin/*` request, not just page load
- Passwords hashed with bcrypt (never plaintext, never reversible encryption)
- Rate-limit `/api/admin/auth` to prevent brute-force login attempts
- Sanitize all admin-entered fields (description, terms) before rendering — prevent stored XSS since this content is publicly displayed
- Affiliate/booking URLs should be validated as well-formed URLs before save, to prevent open-redirect abuse via `/api/redirect/[id]`

---

## 8. Deployment (Hostinger)

1. Push code to a GitHub repository
2. In Hostinger's hPanel, connect the Web App to the GitHub repo (auto-deploy on push to `main`)
3. Set environment variables in Hostinger's app settings (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.)
4. Provision MySQL database through Hostinger, run `npx prisma migrate deploy` (via Hostinger's deploy hook or manually via SSH if available on your plan)
5. Point `metrocardz.in` domain to the Web App
6. Verify SSL is active (Hostinger provisions this automatically on supported plans)

---

## 9. Scaling Notes (beyond v1)

- If traffic grows significantly, move MySQL read-heavy queries behind a cache layer (Redis) — not needed at launch
- If affiliate tracking becomes complex, consider a dedicated `clicks` table logging every redirect event (deal_id, timestamp, referrer) for reporting
- If "My Card" needs live sync with the existing membership platform, define whether that's a shared DB, a REST call, or a webhook — this is currently an open integration question, not yet architected
