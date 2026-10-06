# Metro Cardz GO — Complete Product Architecture and Workflow

## 1) Executive summary

Metro Cardz GO must be treated as a separate product from the existing Metro Cardz loyalty platform. The current broken behavior comes from mixing the old loyalty system with a new customer discovery experience. This causes route conflicts, overlapping auth flows, and shared UI logic.

The correct product rule is simple:

- Metro Cardz GO is a standalone customer discovery and redemption platform
- Existing Metro Cardz loyalty platform remains its own operational system
- The only approved connection between them is a read-only identity bridge for “My Card”
- No shared database tables, no shared auth session, no shared dashboard logic, and no mixed route structure

This must be enforced as a product and engineering rule, not optional styling.

---

## 2) Root cause of the current clash

The current app fails because it mixes two distinct product families into one surface area:

- old Metro Cardz membership/loyalty flow
- new Metro Cardz GO discovery/rewards experience

This creates conflicts in:

- routing
- login redirection
- dashboard permissions
- shared auth and state
- inconsistent UI styling
- mixed business logic

### Correct architectural boundary

- Metro Cardz GO = customer-focused discovery and redemption experience
- Metro Cardz loyalty platform = membership, points, wallet, and card operations
- Shared connection = read-only identity lookup only

This means they may share brand names, but they must not share app state, login sessions, or database ownership.

---

## 3) Correct system separation strategy

### Product separation

Metro Cardz GO should include:

- customer registration and login
- deal discovery andExplore
- offers by category and city
- merchant redemption and QR validation
- admin deal management
- coupon generation & usage logs
- brand, merchant, and offer management

The legacy Metro Cardz platform should continue to own:

- customer loyalty wallet
- card issuance and membership records
- point balance logic
- existing merchant/admin operational flows

### Identity bridge only

The only allowed integration is a narrow read-only bridge for a member summary.

Example pattern:

- Customer opens “My Card” in Metro Cardz GO
- GO calls a public identity endpoint on the legacy loyalty platform
- Response includes only safe member summary data like:
  - name
  - card number
  - membership status
  - points
  - coupons
  - recent rewards
- No write access
- No session hijacking
- No shared table ownership
- No shared middleware or toolchain logic

---

## 4) Full workflow of the system

### A. Customer flow

1. Customer lands on Metro Cardz GO
2. User selects registration or login
3. User enters mobile number
4. OTP verification completes
5. User accesses digital membership card and dashboard
6. Customer browses category lists like:
   - Water Parks
   - Restaurants
   - Cafés
   - Resorts
   - Movies
   - Gaming
   - Events
7. User filters by city and location
8. System shows curated card-based deal listings
9. Customer opens offer details
10. User taps “Get Coupon” or “Book Now”
11. System generates a digital coupon or QR token
12. Coupon is stored with status = active and valid window
13. Customer visits merchant location
14. Merchant scans QR and validates redemption
15. Redemption is marked complete and logged

### B. Merchant flow

1. Merchant logs in to Metro Cardz GO merchant portal
2. Merchant opens scan flow
3. Merchant scans customer QR code
4. System validates:
   - coupon exists
   - still active
   - not expired
   - not already redeemed
   - merchant is allowed for that deal
5. Redemption is marked successful
6. System logs the transaction and updates analytics
7. Merchant can access reports and daily totals

### C. Admin flow

1. Admin logs in
2. Admin manages customers, brands, merchants, deals, and coupons
3. Admin creates or edits deal data
4. Admin reviews partner status and approval rules
5. Deal is activated only when all required checks pass
6. Customers can only see active and verified offers
7. Reports and analytics are produced from redemption activity

---

## 5) Partner status governance logic

This is a critical business rule and must be enforced in code, not only in labels.

### Required statuses

- PUBLIC LINK
- AFFILIATE
- AUTHORISED PARTNER
- DIRECT MERCHANT

### Rule
Partner status is mandatory and must not default silently.

### Enforcement logic

- PUBLIC LINK
  - only directory listing
  - no official partner claims
  - no logo or trust badge unless legally approved
  - no exclusive-brand language

- AFFILIATE
  - only approved affiliate tracking links
  - no fabricated brand endorsement claims

- AUTHORISED PARTNER
  - can use approved brand references and logo when documentation exists
  - only after formal partner approval

- DIRECT MERCHANT
  - fully accepted commercial relationship
  - full merchant rights to direct redemption and reporting

### Important requirement
The UI must not render dangerous partner claims based only on a label. Backend rules must block unsafe rendering and invalid offer copy.

---

## 6) Data model direction

The system should have its own logical data domain.

### Core tables

- deals
- deal_categories
- brands
- offers
- coupons
- redemptions
- merchants
- admin_users
- customer_users
- merchant_scans
- locations
- city_data

### Deal schema

A deal should include:

- brand name
- category
- sub-category
- city
- location
- description
- offer title
- offer percentage
- offer type
- start date
- end date
- booking URL
- affiliate URL
- phone
- Google Maps URL
- website
- Instagram
- logo image
- partner status
- terms and conditions
- last verified date
- featured
- active
- created at
- updated at

### Operational requirement

Even if deployed on the same infrastructure, these tables should be in a separate schema or separate logical database boundary from the legacy loyalty platform.

---

## 7) UI direction: clean, light, and discovery-app style

The product should feel like a premium lifestyle app, not a generic legacy dashboard.

### Design rules

- mostly white and warm off-white backgrounds
- no dark mode
- no full-screen gradient chaos
- accent color should be warm orange or gold, used sparingly
- real photography preferred
- venue-first design with card layouts
- horizontal category carousels
- sticky filter bar
- strong hierarchy with readable text blocks
- compact but premium spacing
- real brand and place copy instead of generic lorem-style marketing

### Avoid

- dark UI surfaces
- large generic hero gradients
- repeated feature icon grid layouts
- template-looking cards
- bland “AI SaaS” design language

### Preferred patterns

- discovery cards with photo top and info below
- city-based collections
- “Today’s Offers” sections
- “Weekend Escape” sections
- “Food & Café Picks” sections
- “Water Park & Family Deals” sections

---

## 8) In-depth developer prompt

> Build a new Metro Cardz GO web application as a completely separate product from the existing Metro Cardz loyalty platform. Do not reuse shared components, styling system, auth state, database schema, route structure, or dashboard logic from the existing loyalty app. Treat Metro Cardz GO as a distinct product with independent design system, codebase, database tables, and user flows.
>
> The app must be mobile-first and PWA-ready. It should support three roles: Customer, Merchant, and Admin.
>
> Customer flow: Registration → OTP verification → Digital Membership Card → Category browse → City and location filters → Offer listing → Offer detail → Get Coupon → QR generation → Merchant redemption.
>
> Merchant flow: Login → Scan customer QR → Validate coupon → Confirm redemption → Update redemption logs → View merchant reports.
>
> Admin flow: Login → Manage Customers, Merchants, Brands, Offers, Coupons, Redemptions, Reports → Create and manage deals → Set partner status → Set featured and active flags → View analytics/export data.
>
> The identity bridge is the only allowed connection between Metro Cardz GO and the legacy Metro Cardz loyalty platform. It must be read-only and must not allow writing, shared auth, shared database access, or shared UI logic.
>
> The app must use a modern, light, premium discovery-app design inspired by Zomato, Swiggy, and Dineout. The design language should be white/light gray, photography-led, clean typography, compact cards, sticky filters, and warm accent usage. No dark mode, no AI-style gradients, no decorative blob backgrounds.
>
> All deal cards must use real photographs of actual venues or clearly labeled placeholders. Never use generic icon illustrations as a substitute for venue photography.
>
> The admin deal form must include: Brand name, Category, Sub-category, City, Location, Description, Offer title, Offer percentage, Offer type, Start date, End date, Booking URL, Affiliate URL, Phone, Google Maps URL, Website, Instagram, Logo image, Partner status, Terms & conditions, Last verified date, Featured, Active.
>
> Partner status must be a required dropdown with no default value. Allowed values: PUBLIC LINK, AFFILIATE, AUTHORISED PARTNER, DIRECT MERCHANT. The UI and backend must enforce that PUBLIC LINK cannot display official partner branding, logo claims, or exclusive-language badges.
>
> Build a clean architecture with separate modules for authentication, customer app, merchant app, admin app, deals management, coupon generation, QR validation, redemption engine, reports and export, and identity bridge to the loyalty platform.
>
> Use role-based access control, modular API flows, and a future-ready design for third-party integrations.
>
> Maintain strict separation in documentation: Metro Cardz GO is a separate product; the old Metro Cardz loyalty platform remains a separate system; only one sanctioned integration exists — the read-only My Card identity bridge.
>
> The final experience must feel premium, conversion-focused, and lifestyle-first, not like a legacy loyalty dashboard.

---

## 9) Recommended workflow architecture

### Frontend

- Metro Cardz GO web app
- customer portal
- merchant portal
- admin portal
- separate route prefixes or separate subdomain

### Backend

- separate service or app
- independent API layer
- independent schema and migration set
- role-based endpoints

### Database

- separate tables
- separate migration history
- dedicated admin management panels

### Security

- OTP-based login
- role-based access rules
- partner status gating in backend and UI
- coupon redemption checks before approval

### Reporting

- CSV and Excel export
- merchant performance reporting
- admin analytics dashboard
- daily redemption trends

---

## 10) Final recommendation

The biggest issue in the current build is not only visual polish. It is a structural product boundary problem.

The correct rebuild is:

- a new independent discovery product
- with distinct UI language
- isolated auth and routing
- separate schema and data ownership
- narrow identity bridge only

That is the only clean long-term architecture for Metro Cardz GO.
