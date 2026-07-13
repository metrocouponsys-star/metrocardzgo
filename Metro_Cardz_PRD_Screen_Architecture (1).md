# Metro Cardz — PRD + Screen Architecture (for Stitch UI Build)

**Version:** 2.0
**Purpose of this doc:** Full product requirements + a screen-by-screen spec detailed enough to prompt directly into Stitch (or any AI UI generator) for frontend design, without needing separate clarification per screen.

---

## PART A — PRD

### 1. Product Summary
Metro Cardz is a cloud-based, no-install loyalty and membership platform for single-location Indian SMBs (salons, kirana stores, restaurants, jewellery shops, boutiques, opticians). Merchants issue QR-coded membership cards; the QR is purely an ID key. All offers, balances, and reminders (birthday, anniversary, monthly, festival, loyalty, referral, discount) live server-side and can change without reprinting cards.

### 2. Users & Roles
| Role | Access |
|---|---|
| Super Admin | Full platform control across all merchants |
| Merchant Owner | Full control of their own business account |
| Merchant Staff | Limited — lookup + redeem only, no settings/reports access |
| Customer | No login — public read-only self-check page via own QR scan |

### 3. Goals
- Zero-install, browser-only experience on any device
- Merchant can complete a redemption in under 15 seconds
- Offers/reminders update centrally, no card reprints
- Automated lifecycle messaging (birthday, anniversary, expiry, loyalty threshold) with no manual merchant effort

### 4. Non-Goals (V1)
- Native mobile apps
- POS integration
- In-app payments/wallet top-up
- AI analytics
- Multi-location merchant hierarchies

---

## PART B — SCREEN ARCHITECTURE

Each screen below includes: purpose, layout structure, all components, states, and the data each component displays — written so it can be pasted directly into Stitch as a design prompt.

---

### SCREEN GROUP 1 — AUTH & ONBOARDING

#### 1.1 Login Screen
**Purpose:** Single login entry point for Super Admin, Merchant Owner, and Staff — role is determined post-login, not selected.
**Layout:** Centered card on plain background, mobile-first, max-width 400px on desktop.
**Components:**
- Metro Cardz logo (top, centered)
- Heading: "Login to Metro Cardz"
- Input: Mobile number (or email toggle)
- Input: Password, OR "Send OTP" button (toggle between password/OTP modes)
- Primary button: "Login"
- Link: "Forgot password?"
- Footer text: "New merchant? Contact support to get onboarded" (no self-signup in V1 — onboarding is managed)
**States:** default, loading (spinner on button), error (invalid credentials — red inline message below input), OTP-sent (input changes to 6-digit OTP field with countdown resend timer)

#### 1.2 OTP Verification Screen
**Purpose:** Verify OTP for login or staff-added-by-owner first login.
**Layout:** Centered card, same shell as login.
**Components:**
- Heading: "Enter OTP sent to +91 XXXXX XXXXX"
- 6-box OTP input
- "Resend OTP" text link (disabled with countdown until resend available)
- Primary button: "Verify"
**States:** default, verifying, error (wrong OTP), expired

#### 1.3 Merchant Onboarding Wizard (Super Admin creates, but merchant completes profile on first login)
**Purpose:** First-time setup after Super Admin creates account credentials.
**Layout:** Multi-step wizard, progress indicator (steps 1–4) at top.
- **Step 1 — Business Details:** business name, category (dropdown: Salon/Kirana/Restaurant/Jewellery/Boutique/Optician/Other), address, WhatsApp number, logo upload
- **Step 2 — Membership Types:** add one or more types (e.g. "Prime", "Standard") — name + description fields, "+ Add another type" button
- **Step 3 — Offer Templates:** add offers per membership type — title, description, type (dropdown: %off / free-service / wallet points / referral / birthday benefit), value field, "+ Add another offer" button
- **Step 4 — Review & Finish:** summary card of everything entered, "Confirm & Go to Dashboard" button
**States:** step validation (can't proceed with empty required fields), draft-save (auto-saves progress between steps)

---

### SCREEN GROUP 2 — MERCHANT PANEL (Owner + Staff shared shell, permissions differ)

#### 2.1 Dashboard (Home)
**Purpose:** Landing screen after login — quick stats + fast path to core action (redemption).
**Layout:** Top nav bar (logo, business name, profile menu) + left sidebar (Dashboard, Members, Offers, Redeem, Reports, Campaigns, Settings — Staff sees only Dashboard, Redeem) + main content area.
**Components (main content):**
- Large primary CTA card: "Scan / Search Customer" (biggest visual element — this is the most-used action)
- 4 stat cards in a row (responsive to stack on mobile): Total Active Members, Redemptions Today, Expiring This Week, Wallet Points Issued This Month
- Recent Activity feed (list): last 10 redemptions, each row showing member name, offer used, time
**States:** loading skeleton, empty state (new merchant, zero data — show friendly "Add your first member" prompt instead of empty stats)

#### 2.2 Customer Search / Lookup Screen
**Purpose:** Core redemption entry point — find a member fast via 3 methods.
**Layout:** Full-width search bar at top with 3 tab/toggle options above it: "Mobile Number" / "Membership No." / "Scan QR".
**Components:**
- Tab selector (Mobile / Membership No. / QR Scan)
- If Mobile/Membership No. selected: single text input, autofocus, "Search" button (also accepts USB barcode scanner keystroke input directly into this field)
- If QR Scan selected: camera viewfinder box (browser camera permission prompt), live scanning overlay frame
- Below: recent searches list (last 5 looked-up members, tappable for fast re-access)
**States:** searching (spinner), not found (friendly message: "No member found — Add new member?" with CTA button), camera-permission-denied (fallback message directing to manual entry)

#### 2.3 Member Profile Screen (opens after successful search)
**Purpose:** Show everything about the member and enable redemption — the single most important screen in the product.
**Layout:** Header card + tabbed sections below.
**Components:**
- Header card: member photo (optional/placeholder avatar), name, membership number, membership type badge (e.g. "Prime"), status badge (Active/Expiring Soon/Expired — color-coded green/amber/red), expiry date
- Loyalty points balance display (prominent, large number, e.g. "350 Loyalty Points", replacing "Wallet balance" for clarity)
- Offers list (cards, one per offer): offer title, description, remaining count if applicable (e.g. "4 of 6 Hair Washes Remaining"), inline point-earn badge (e.g. "+10 pts") or point-cost badge (e.g. "100 pts" for points redemption offers), each with a **"Redeem"** button
- Tabs:
  - Active Offers tab: displays the offers list cards described above.
  - Redemption History tab: reverse-chronological list — offer used, date, staff who processed it.
  - Points History tab (Feature 1): reverse-chronological list of loyalty transactions — transaction type (earn/redeem), point change (+10 pts or -100 pts), date/time, trigger offer name, and running balance snapshot.
- Edit/Renew button (owner only — staff should not see this): renew membership, edit details
**States:** offer already fully redeemed (button disabled, shows "Fully Used"), member expired (redeem buttons disabled platform-wide with banner: "Membership expired — renew to continue redemptions"), insufficient loyalty points (redeem button disabled for points redemption rewards if points cost exceeds current balance)

#### 2.4 Redemption Confirmation Modal
**Purpose:** Final confirm step before deducting an offer — prevents accidental taps.
**Layout:** Centered modal overlay.
**Components:**
- Offer name + remaining balance before/after preview (e.g. "4 remaining → 3 remaining")
- "Confirm Redemption" primary button
- "Cancel" secondary button
**States:** confirming (spinner), success (green checkmark animation + auto-close after 2s), error (network/failure message with retry)

#### 2.5 Add New Member Screen
**Purpose:** Enroll a new customer.
**Layout:** Single-column form, mobile-first.
**Components:**
- Fields: Name, Mobile Number, Date of Birth (for birthday reminders), Membership Type (dropdown), Anniversary Date (optional field, labeled clearly what it refers to)
- "Generate QR & Membership Number" button (auto-generates on save, shown as preview)
- "Save & Print Card" primary button
- "Save Only" secondary button (skip printing for now)
**States:** validation errors (invalid mobile format), duplicate detection (mobile number already exists — prompts "View existing member?" instead of erroring)

#### 2.6 Offer Management Screen (Owner only)
**Purpose:** Create/edit/deactivate offer templates.
**Layout:** List view + "Add Offer" button (top right), each row expandable to edit form.
**Components:**
- List of offer cards: title, type badge, value, active/inactive toggle switch, edit/delete icons, loyalty badges indicating points earned or point cost
- Add/Edit form (inline expand or modal):
  - Standard fields: Title, Description, Type dropdown (%off/free-service/wallet/referral/birthday/points_redemption), Value, Applicable Membership Type(s) checkboxes
  - Loyalty settings (Feature 1):
    - For non-points-redemption offers: toggle "This offer earns loyalty points" with a numeric input for points-value earned on redemption
    - For points-redemption rewards (selected via Type): "This is a points redemption reward" input field for points-cost to claim
**States:** unsaved changes warning, deactivated offers shown grayed-out at bottom of list

#### 2.7 Membership Type Management Screen (Owner only)
**Purpose:** Manage membership tiers (Prime, Standard, etc.) and which offers bundle into each.
**Layout:** Card grid, one card per membership type.
**Components:**
- Each card: type name, member count using this type, list of bundled offers (chips), "Edit" button
- "+ Add Membership Type" card (dashed border, plus icon)

#### 2.8 Reports Screen (Owner only)
**Purpose:** Redemption and member analytics.
**Layout:** Filter bar (date range picker, offer filter dropdown, staff filter dropdown) + chart area + data table below.
**Components:**
- Summary stat cards: Total Redemptions, Active Members, Expiring Soon, Most-Used Offer, Monthly Points Issued, Monthly Points Redeemed (Feature 1)
- Bar chart: redemptions by offer type
- Line chart: redemptions over time (daily/weekly toggle)
- Data table: exportable list of all redemptions (columns: Member, Offer, Staff, Date, Time) with CSV export button

#### 2.9 Campaigns Screen (Owner only) — supports the reminder/automation feature
**Purpose:** Manage automated and one-off messaging campaigns.
**Layout:** Two sections — "Automated Reminders" (toggle list) and "One-Time Campaigns" (list + create button).
**Components — Automated Reminders section:**
- Toggle rows: Birthday Reminder (on/off + edit template), Anniversary Reminder (on/off + edit template), Loyalty Threshold Reminder (on/off + threshold value input + edit template)
- Each row expandable to edit (Feature 2):
  - Message template text (with placeholders like `{name}`, `{offer}`, `{balance}`)
  - Send time picker: "Send at [HH:MM]" (defaults to 09:00 AM, editable)
  - Advance days selector: "Send [N] days before" for expiry, birthday, and anniversary triggers (defaults: birthday/anniversary = 0 days before, expiry = 7 days before)
**Components — One-Time Campaigns section:**
- "+ New Campaign" button opens form: Campaign name, Target audience (All members / By membership type / Expiring soon), Message template, Channel (SMS/WhatsApp), Schedule (Send now / Schedule for date)
- List of past/scheduled campaigns: name, audience size, status (Scheduled/Sent/Draft), sent date
**States:** campaign preview before send (shows sample rendered message), confirmation modal before sending to full audience

#### 2.10 Card Print/Export Screen
**Purpose:** Generate printable card design for a member or batch.
**Layout:** Preview pane (card front/back mockup) + settings panel.
**Components:**
- Live card preview: front (logo, name, membership no., QR) and back (3–4 key benefits text, T&Cs, support number) — toggle front/back view
- Batch mode: select multiple members (checkboxes in a list) or "All new members this week"
- "Download PDF" / "Download as Images" buttons
**States:** single-member vs batch mode toggle, preview loading

#### 2.11 Settings Screen (Owner only)
**Purpose:** Business profile, staff management, plan info.
**Layout:** Tabbed sections: Business Profile, Staff Accounts, Notification Templates, Plan & Billing.
**Components:**
- Business Profile tab: editable business name, logo, category, WhatsApp number, address
- Staff Accounts tab: list of staff (name, phone, role), "+ Add Staff" button, remove/deactivate icons per row
- Notification Templates tab: shortcut into Campaigns' automated reminders section
- Plan & Billing tab: current plan name, renewal date, "Contact to upgrade" button (no self-serve payment in V1 per current scope)

---

### SCREEN GROUP 3 — SUPER ADMIN PANEL

#### 3.1 Admin Dashboard
**Purpose:** Platform-wide overview.
**Layout:** Top nav + sidebar (Dashboard, Merchants, Reports, Settings) + main content.
**Components:**
- Stat cards: Total Merchants, Total Members Across Platform, Redemptions Today (platform-wide), Active vs Inactive Merchants
- Merchant activity table: recent signups, recent activity spikes

#### 3.2 Merchant Management Screen
**Purpose:** Create, view, edit, suspend merchant accounts.
**Layout:** Table/list view + "Add Merchant" button.
**Components:**
- Table columns: Business Name, Category, Plan Tier, Status (Active/Suspended), Members Count, Created Date, Actions (view/edit/suspend)
- "Add Merchant" opens the onboarding wizard (Screen 1.3) in admin-initiated mode
- Row click opens Merchant Detail view (read-only mirror of that merchant's dashboard, for support purposes, with an "Impersonate/Login as Merchant" button)

#### 3.3 Platform Reports Screen
**Purpose:** Cross-merchant analytics for internal use.
**Layout:** Same structure as Merchant Reports (2.8) but aggregated across all merchants, with a merchant filter dropdown.

---

### SCREEN GROUP 4 — CUSTOMER-FACING (No Login)

#### 4.1 Public Self-Check Page (`metrocardz.in/m/{token}`)
**Purpose:** Customer scans their own card to view their own benefits — no login, read-only.
**Layout:** Simple single-column mobile page, branded with merchant logo at top.
**Components:**
- Merchant logo/name header
- Member name + membership type badge
- Membership status (Active/Expiring/Expired) with expiry date
- Loyalty Points balance (large, prominent, replacing "Wallet balance" for clarity)
- Offers list (same card style as 2.3 but read-only, no redeem buttons, displaying point-earn or point-cost badges)
- Footer: merchant contact/support number
**States:** expired membership (banner: "Your membership has expired — visit [business name] to renew"), invalid/expired token (generic "Card not recognized" message, no data leak)

---

## PART C — SHARED UI COMPONENTS LIBRARY (for consistency across all screens in Stitch)

- **Status badges:** Active (green), Expiring Soon (amber), Expired (red), Inactive (gray)
- **Offer card:** icon (per offer type) + title + description + remaining count/value + action button (Redeem or none)
- **Stat card:** large number + label + optional trend indicator
- **Empty state pattern:** icon + friendly message + primary CTA button
- **Confirmation modal pattern:** used for redemption, staff removal, campaign send — title + description + confirm/cancel buttons
- **Bottom nav (mobile)** vs **left sidebar (desktop)** — same nav items, responsive breakpoint switch
- **Toast notifications:** success (green, top-right, auto-dismiss), error (red, persists until dismissed)

---

## PART D — SCREEN LIST SUMMARY (quick reference for Stitch prompt sequencing)

1. Login
2. OTP Verification
3. Merchant Onboarding Wizard (4 steps)
4. Merchant Dashboard
5. Customer Search/Lookup
6. Member Profile
7. Redemption Confirmation Modal
8. Add New Member
9. Offer Management
10. Membership Type Management
11. Reports
12. Campaigns (Automated + One-Time)
13. Card Print/Export
14. Settings (Business/Staff/Templates/Billing)
15. Super Admin Dashboard
16. Merchant Management (Admin)
17. Platform Reports (Admin)
18. Public Customer Self-Check Page

**Recommended Stitch build order:** Login → Merchant Dashboard → Customer Search → Member Profile → Redemption Modal (this is the critical path, build and validate it first) → Add Member → Offer Management → Campaigns → Reports → Settings → Admin screens → Public self-check page last.
