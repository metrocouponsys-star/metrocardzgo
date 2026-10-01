# Metro Cardz — Deals & Experiences Platform
## Product Requirements Document (PRD)

**Version:** 1.0
**Owner:** DeveloperBee
**Status:** Draft for build

---

## 1. Overview

### 1.1 Problem Statement
Metro Cardz members own a physical NFC gold card tied to a membership/loyalty system. There is currently no way to surface time-sensitive deals (water parks, dining, events, stays) to a member who taps their card, without reprinting or replacing the card every time inventory changes.

### 1.2 Solution
A single permanent URL (`metrocardz.in/go`) encoded on the NFC card, resolving to a dynamic, database-driven deals directory. Content (brands, offers, cities) is managed entirely through an admin panel — the physical card never needs to change.

### 1.3 Goals
- One NFC tap → member sees relevant, current, location-filtered deals within 2 taps
- Zero code deploys required to add/remove/update a deal
- Legally clean separation between "public link," "affiliate," and "official partner" listings
- Ship v1 without building a payments/booking engine — redirect to the provider's own checkout

### 1.4 Non-Goals (v1)
- No in-app ticket purchase or payment processing
- No native mobile app
- No real-time inventory sync with brand APIs
- No user accounts for browsing (only "My Card" ties to existing membership)

---

## 2. Users

| User | Need |
|---|---|
| Metro Cardz member (public) | Tap card → find a deal near me → book it fast |
| Metro Cardz admin/ops team | Add/edit/expire deals without a developer |
| Brand/merchant (indirect) | Get discovered by Metro Cardz members, honor whatever partnership tier was agreed |

---

## 3. Information Architecture

```
/go                    → NFC landing (category picker)
/category/[slug]       → e.g. /category/waterparks
/city/[slug]           → optional city-level landing
/category/[slug]?city= → filtered deal grid
/deal/[id]             → offer detail page
/live-offers           → curated "today's top deals" (homepage-equivalent)
/my-card               → member login-gated, pulls from existing membership system
/admin/login
/admin/deals           → CRUD table
/admin/deals/new
/admin/deals/[id]/edit
/admin/brands
```

### Categories (v1)
Water Parks, Gaming & Entertainment, Movies, Restaurants, Cafés, Events, Resorts & Hotels, Hill Stations (Lonavala, Matheran, Mahabaleshwar as sub-pages)

### Cities/Locations (v1)
Mumbai, Thane, Navi Mumbai, Lonavala, Matheran, Mahabaleshwar, Panchgani, Alibaug, Igatpuri

---

## 4. Functional Requirements

### 4.1 Public Site

**FR-1: NFC Landing (`/go`)**
- Loads in under 2 seconds on mobile data
- Displays 8 category tiles with icons
- No login required

**FR-2: Category → City → Deal flow**
- Selecting a category shows a city filter (chips or dropdown)
- Selecting a city filters the deal grid via API, no full page reload
- Each deal card shows: brand name, location, offer headline, partner-status-appropriate badge, CTA button

**FR-3: Deal Detail Page**
- Full offer description, terms & conditions, last-verified date
- Primary CTA routes to `booking_url` or `affiliate_url` depending on `partner_status`
- Secondary actions where applicable: Call, Map, Instagram (per category — restaurants/cafés only)

**FR-4: Live Offers Page**
- Manually curated via `featured = true` flag in admin
- Cross-category — pulls top deal per category, ordered by admin-set priority

**FR-5: My Card**
- Reads from existing Metro Cardz membership system (integration point, not rebuilt)
- Displays: member name, card number, status, points, coupons, bookings, referral link

**FR-6: Partner Status Disclosure Logic**
This is a compliance-critical rule, not cosmetic:
| Status | Frontend behavior |
|---|---|
| `PUBLIC_LINK` | Plain listing, no Metro Cardz branding overlap, no discount claim unless independently verified public info |
| `AFFILIATE` | Uses affiliate tracking link, may show "Available via Metro Cardz" but not "Partner" |
| `AUTHORISED_PARTNER` | Can show brand logo, "Metro Cardz Partner" badge, and any discount explicitly agreed |
| `DIRECT_MERCHANT` | Full branding, in-house negotiated offer, highest display priority |

The frontend must read this field on every render — never hardcode partner language in a template.

### 4.2 Admin Panel

**FR-7: Authentication**
- Email/password login, single role (`admin`) for v1 — no need for granular RBAC yet
- Session-based or JWT, protected `/admin/*` routes

**FR-8: Brand Management (CRUD)**
Fields: name, category, city, description, website, Instagram, phone, Google Maps URL, logo, partner_status (required, no default), active flag

**FR-9: Deal Management (CRUD)**
Fields: brand (FK), offer title, offer %, offer type, start date, end date, booking URL, affiliate URL, terms & conditions, last verified date, featured (bool), active (bool)

**FR-10: Validation Rules**
- `partner_status` is mandatory — cannot save a deal without it
- If `partner_status = AFFILIATE`, `affiliate_url` becomes required
- `end_date` must be ≥ `start_date`
- Expired deals (`end_date` < today) auto-flip `active = false` via a scheduled check, not deleted (kept for history/reporting)

**FR-11: Stale Content Flagging**
- Dashboard highlights any deal with `last_verified_date` older than 30 days
- Non-blocking (doesn't hide the deal), just a visual flag for ops follow-up

---

## 5. Data Model

```
brands
├─ id (PK)
├─ name
├─ category_id (FK)
├─ city_id (FK)
├─ description
├─ logo_url
├─ website
├─ instagram
├─ phone
├─ maps_url
├─ partner_status (ENUM: public_link, affiliate, authorised_partner, direct_merchant)
├─ active (bool)
└─ created_at

categories
├─ id (PK)
├─ name
└─ slug

cities
├─ id (PK)
├─ name
└─ slug

deals
├─ id (PK)
├─ brand_id (FK)
├─ offer_title
├─ offer_percentage
├─ offer_type
├─ start_date
├─ end_date
├─ booking_url
├─ affiliate_url
├─ terms
├─ last_verified_date
├─ featured (bool)
└─ active (bool)

admin_users
├─ id (PK)
├─ email
├─ password_hash
└─ role
```

---

## 6. Technical Requirements

- **Hosting:** Hostinger Web App Hosting (already provisioned)
- **Framework:** Next.js (SSR/ISR for public pages, API routes for backend)
- **Database:** MySQL (Hostinger-managed)
- **ORM:** Prisma
- **Auth:** NextAuth.js or JWT + bcrypt (admin only)
- **Styling:** Tailwind CSS
- **Performance target:** `/go` and category pages load in <2s on 4G
- **SEO:** Category and deal pages should be server-rendered/indexable — this becomes an organic acquisition channel over time, not just an NFC destination

---

## 7. Success Metrics (v1)

- Number of NFC taps → `/go` loads (basic analytics event)
- Category → deal detail click-through rate
- Deal detail → "Book Now" click-through rate (proxy for redirect conversion, since v1 doesn't track actual bookings)
- Admin time to add a new deal (target: under 3 minutes)
- % of deals with `last_verified_date` within 30 days (content freshness health)

---

## 8. Open Questions

- Does "My Card" require a new API integration with the existing membership platform, or does that system already expose an endpoint/DB you can read from?
- Affiliate programs (Agoda, Thrillophilia, etc.) — which have been applied to, and which are still `PUBLIC_LINK` pending approval?
- Who owns ongoing content upkeep post-launch (deal verification, expiry) — DeveloperBee or Metro Cardz's own team?

---

## 9. Rollout Plan

**Phase 1 (v1 build — ~3 weeks):** Core schema, admin CRUD, public category/deal pages, NFC landing, redirect logic
**Phase 2:** Affiliate link tracking/attribution, city-level SEO landing pages, basic analytics dashboard
**Phase 3:** Booking-intent capture (form before redirect, for lead data) if Metro Cardz wants attribution beyond click-through

---

# Design Prompt

Use this as the brief for whoever designs the UI (yourself, a designer, or an AI design tool):

> Design a mobile-first web app called "Metro Cardz — Deals & Experiences." The primary entry point is a category-picker landing page reached via NFC tap, so it must load fast and feel instant — minimal text, large tappable icons, no scroll-heavy hero sections.
>
> **Visual direction:** Premium but approachable — this sits alongside a "gold card" membership product, so use a dark charcoal or deep navy base with a warm gold/amber accent (matching the physical card), not a generic bright SaaS palette. Typography should feel confident and slightly editorial (a strong sans-serif for headings, clean body font) rather than corporate-default.
>
> **Key screens to design:**
> 1. Category grid (`/go`) — 8 tiles (Water Parks, Gaming, Movies, Restaurants, Cafés, Events, Resorts, Hill Stations), icon-led, single-tap navigation
> 2. Deal grid — card-based list with brand logo, one-line offer, city tag, and a single clear CTA button per card
> 3. Deal detail — hero image/logo, offer terms, verified date (small, trust-building), primary CTA
> 4. Live Offers — cross-category curated feed, visually distinct as "today's picks" (e.g., a subtle featured-ribbon treatment)
> 5. My Card — member dashboard reusing the existing Metro Cardz membership visual language, not a new design system
> 6. Admin panel — plain, table-first, utilitarian (no need for the same polish as the public site — optimize for speed of data entry, not aesthetics)
>
> **Constraints:**
> - Every deal card must be able to show one of four partner-status treatments (public link / affiliate / authorised partner / direct merchant) without redesigning the card — vary via a badge/label only
> - Design for one-handed mobile use — most traffic originates from an NFC tap on a phone
> - Keep the redirect moment (tap "Book Now" → leaves to brand site) honest — no dark patterns implying the transaction stays within Metro Cardz
