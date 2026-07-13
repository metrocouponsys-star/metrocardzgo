# Metro Cardz — Product & Market Research Report
*Prepared for DeveloperBee | July 2026*

---

## 1. Bottom line up front

The concept (QR-as-ID-key, offers stored server-side, redeemed via mobile web scan) is correct and it's how every serious loyalty platform already works — this is not a novel architecture, it's the industry-standard pattern. The real risk to Metro Cardz isn't the tech, it's positioning: you're describing a lightweight version of what Capillary, Easyrewardz, and Zeta already sell to enterprise retail. Your actual wedge is the segment they ignore — kirana, single-location salons, small jewellers — where their pricing and onboarding complexity price them out. Say that explicitly in your GTM, because right now the spec reads like a smaller Capillary, which is a losing frame.

---

## 2. Market context

<cite index="10-1">India's loyalty program market is projected to grow from roughly $4.3 billion in 2025 to $17.1 billion by 2035, a 16.1% CAGR, with Capillary Technologies holding 15–20% market share, InterMiles 10–15%, and Zeta 8–12%.</cite> <cite index="10-1">Retail and e-commerce account for around 48% of the 2025 market, and forecasts specifically call out kirana stores as a segment likely to adopt introductory loyalty schemes as SMS/USSD and mobile-based tools reach less smartphone-saturated users.</cite>

That last point matters for you directly: the big platforms are built for chains (Bata, Pantaloons, PVR), not standalone shops. <cite index="14-1,17-1">EasyRewardz, founded in 2011 and based in Gurgaon, has raised about $14M and serves enterprise retail, BFSI, and healthcare clients like Bata, Tommy Hilfiger, and Motherhood Hospitals</cite> — none of that sales motion or pricing translates to a single kirana or salon owner. <cite index="18-1">Capillary's Loyalty+ product leans on AI-driven tiering and behavior-based rewards</cite> — again, enterprise-grade complexity a single-location merchant has no use for and can't afford.

On the low end, you're competing with generic QR-loyalty SaaS tools (Loopy Loyalty, Kangaroo Rewards, PassKit-style stamp cards) that are card-agnostic, self-serve, global, and cheap — usually $20–50/month. <cite index="8-1">PassKit and similar platforms position themselves around generating, organizing, and distributing QR codes for loyalty cards with a free-trial self-serve model</cite>. These are a real threat if a tech-savvy salon owner just Googles "QR loyalty card app" — you need a reason they'd pick Metro Cardz (India-specific onboarding, WhatsApp-native redemption, rupee pricing, local support, possibly the physical card itself as a trust object) over a global self-serve tool.

**Your actual competitive gap:** nobody is doing white-labelled physical card + QR + managed onboarding + WhatsApp-first redemption specifically for Indian single-location SMBs at a sub-₹1,000/month price point. That's a real gap. It's not "loyalty software" as a category — it's "loyalty-as-a-service for the shop that has one till and one owner."

---

## 3. Technical architecture review

Your three redemption options are sound, and your prioritization is correct. A few sharpening points:

**Option 1 (web login) and Option 2 (QR scan)** are really the same system with two entry points — don't present them as separate options in your own head; QR scan should just be the *fast path into* the web login session, pre-filled to the member record. Build one merchant panel, and treat "type mobile number" vs "scan QR" as two lookup methods hitting the same `GET /members/{id}` endpoint.

**Option 3 (barcode + USB scanner)** — correct to scope this only for supermarket billing counters. Don't build a separate ingestion path for it: a USB barcode scanner just emits keystrokes into whatever field has focus, so on the software side it's identical to someone typing the membership number. No separate integration work required beyond an autofocus text field — this is a UX detail worth flagging to whoever pitches this to supermarket owners, since it removes what sounds like scanner "integration" from your build estimate entirely.

**QR payload — your instinct is correct, keep it minimal.** Encoding only `SAL001` (or a signed/opaque token version of it) rather than any offer data is the right call for exactly the reason you gave: offers change, cards don't get reprinted. Two refinements to plan for now rather than retrofit later:

- Use an opaque or signed ID (e.g. `MC-8f3a2b1c`) rather than a guessable sequential one like `SAL001`. Sequential IDs mean anyone can enumerate `SAL002`, `SAL003`... and pull other customers' offer balances if your API doesn't authenticate the merchant session properly. This is a real data-exposure risk in a "just an ID" design, not a hypothetical one.
- Decide now whether the QR encodes a raw ID or a URL (`metrocardz.in/m/8f3a2b1c`). A URL means the QR also works if scanned by a *customer's own phone camera* (no merchant app needed) and can show a customer-facing "your benefits" page — useful for word-of-mouth and for customers who want to check their own balance without walking into the shop.

### Minimum data model (this is the core of "the software")

```
merchants          (id, business_name, category, plan_tier, whatsapp_number)
members            (id, merchant_id, member_code, name, phone, membership_type,
                     joined_date, expiry_date, wallet_balance)
offer_templates     (id, merchant_id, title, description, type[%off/free-service/wallet/referral],
                     value, active)
member_offer_state  (member_id, offer_template_id, remaining_qty, status)  -- tracks e.g. "4 of 6 hair washes left"
redemption_log      (id, member_id, offer_template_id, merchant_user_id, amount, timestamp)
merchant_users       (id, merchant_id, name, role[owner/staff], login credentials)
```

This 6-table core is genuinely simple — a competent build is 3–5 weeks for MVP (auth, member lookup, offer display, redeem-and-deduct, basic reporting) given your stack (React/FastAPI/Postgres, which you already run for IntelliOps). The scope creep risk is entirely in the "required" list below, not this core.

---

## 4. Reality check on your "Required" feature list

You listed two tiers of features but didn't separate them — doing that explicitly matters a lot for scoping and pricing:

**Tier 1 — MVP (build first, ships to real merchants in weeks):**
- Super Admin panel, Merchant panel, Customer database, QR scanning, Points/wallet, Offer management, Membership management, basic Reports, mobile-friendly web app, Metro Cardz branding.

**Tier 2 — Growth-stage, not MVP (each of these is its own multi-week project, don't quote them as one line item):**
- Native Android/iOS apps — skip entirely for V1. A mobile-friendly web app scanned via browser camera does everything you described; a native app adds app-store review cycles, two codebases, and update friction for zero functional gain at this stage.
- WhatsApp API integration — genuinely high-value for this audience (India + WhatsApp-first small business owners) but requires a Business Solution Provider (BSP) like Gupshup, Twilio, or Interakt, template approval from Meta, and per-message costs. Budget this as Phase 2, not launch.
- SMS gateway — cheap and easy (Msg91, Twilio), can go in MVP if budget allows, mainly for OTP login and expiry reminders.
- POS integration — scope creep unless a specific supermarket client demands it; every POS vendor has a different API, this is bespoke work per client, not a platform feature.
- Payment gateway — only needed if you're monetizing wallet top-ups or charging merchants in-app; if you're billing merchants via subscription outside the app, skip for V1.
- AI analytics / advanced marketing automation — these are what Capillary and Easyrewardz sell to justify enterprise contracts. For your segment, "AI analytics" for a salon with 200 members is a vanity feature until you have real usage data to analyze. Park it.

Quoting all of this as one bundled "required" spec to a client or in a hackathon pitch will make the project look like a 6-month enterprise build instead of a 4-week MVP — that's the single biggest thing to fix in how this document is currently framed.

---

## 5. Card design & QR content — your section is already correct

Your own reasoning here (don't print offers on the card, print "Scan QR to View Latest Membership Benefits" instead) is the right call and matches how every serious program does it. Nothing to add technically. One business-side addition: back-of-card real estate should also carry a renewal/expiry-driven CTA (e.g. "Expires [date] — scan to renew") since expiry-driven WhatsApp/SMS nudges are typically the single highest-ROI automation in loyalty programs, and it's cheap to build once you have the SMS/WhatsApp layer.

---

## 6. Recommended phasing

| Phase | Scope | Timeframe |
|---|---|---|
| 0 | Data model, merchant/member auth, QR ID generation | 1 week |
| 1 (MVP) | Merchant panel, member lookup (mobile no. + QR + membership no.), offer display, redeem-and-deduct, basic reports | 3–4 weeks |
| 2 | SMS gateway (OTP + expiry reminders), customer-facing "check my benefits" QR-scan page | 1–2 weeks |
| 3 | WhatsApp API (redemption confirmations, expiry nudges, referral flow) | 2–3 weeks, contingent on BSP approval |
| 4 | POS integration (only if a specific client needs it), payment gateway (only if monetizing top-ups) | Per-client |
| 5 | AI analytics / marketing automation | Only after ≥3 merchants with 6+ months of real redemption data |

---

## 7. Open questions worth settling before build starts

1. Who's the first paying merchant — do you have one lined up, or is this pre-sales? Everything above assumes you're building toward a specific segment (salon vs. kirana vs. jewellery), and the merchant panel UX (offer complexity, wallet vs. simple stamp-card) differs meaningfully between those.
2. Is Metro Cardz billing merchants (subscription/SaaS) or is this a one-off client build? That decision changes whether payment gateway is Phase 1 or Phase 4.
3. Physical card printing/logistics — who handles reprints when a merchant's offers change enough to need a redesign of the back-of-card benefit summary? This is a recurring operational cost you haven't scoped yet.
