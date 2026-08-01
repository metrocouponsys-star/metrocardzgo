# Metro Cardz — Complete User & Feature Operational Manual
*An all-in-one step-by-step guide for store owners, cashiers, and administrators to operate Metro Cardz, log transactions, scan cards, manage loyalty points, and scale customer retention.*

---

## 📋 Table of Contents
1. [📱 System Overview & Architecture](#-system-overview--architecture)
2. [🚀 Quick Start Guide (First-Time Setup)](#-quick-start-guide-first-time-setup)
3. [🔍 Comprehensive Feature-by-Feature Guide](#-comprehensive-feature-by-feature-guide)
   - [1. Dashboard & Analytics](#1-dashboard--analytics)
   - [2. Search Member & Point Scanning (Core Operation)](#2-search-member--point-scanning-core-operation)
   - [3. Add Member & Onboarding](#3-add-member--onboarding)
   - [4. Members Directory & Tier Management](#4-members-directory--tier-management)
   - [5. Physical Card Inventory & QR Linking](#5-physical-card-inventory--qr-linking)
   - [6. Membership Tiers Configuration](#6-membership-tiers-configuration)
   - [7. Rewards & Points Engine](#7-rewards--points-engine)
   - [8. Promotional Offers & Coupons](#8-promotional-offers--coupons)
   - [9. Automated Campaigns & Broadcasts](#9-automated-campaigns--broadcasts)
   - [10. Business Reports & Insights](#10-business-reports--insights)
   - [11. Merchant Settings & Customization](#11-merchant-settings--customization)
4. [⚡ "Every Point Scanning" Operating Procedures](#--every-point-scanning-operating-procedures)
   - [A. Live Camera Scanning](#a-live-camera-scanning)
   - [B. Photo / Image Upload Scanning](#b-photo--image-upload-scanning)
   - [C. Manual Lookup Fallback](#c-manual-lookup-fallback)
   - [D. Visit Recording & Point Accrual Math](#d-visit-recording--point-accrual-math)
   - [E. Claiming & Deducting Rewards](#e-claiming--deducting-rewards)
5. [📱 Customer Portal (Public Member Pass)](#-customer-portal-public-member-pass)
6. [❓ Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 📱 System Overview & Architecture

Metro Cardz connects physical membership cards (NFC chips or high-density QR codes) with a cloud-based digital loyalty platform. The system operates via two integrated interfaces:

1. **Merchant Portal** *(Internal)*: Used by store owners and counter cashiers to register members, scan physical cards/QR codes, log sales visits, issue points, redeem rewards, and view business analytics.
2. **Customer Portal (Public Pass)** *(External)*: Accessible via web browsers on mobile phones without installing an app. Customers view live point balances, active discount coupons, milestone scratch cards, and share their personal WhatsApp referral link.

---

## 🚀 Quick Start Guide (First-Time Setup)

Follow this checklist when launching Metro Cardz at your store:

1. **Upload Branding**: Go to **Settings** → Upload your business logo and configure store contact details.
2. **Setup Membership Tiers**: Go to **Membership Tiers** → Customize Silver, Gold, and Platinum thresholds (e.g., minimum visits or total spend required).
3. **Configure Points Earning Rules**: Go to **Rewards** → **Points Rules** → Set point accrual rules (e.g., 20 points flat per visit or 1 point per ₹10 spent).
4. **Create Reward Catalog**: Go to **Rewards** → **Reward Catalog** → Add unlockable perks (e.g., *"Free Hair Wash - 500 Points"*).
5. **Add Promotional Coupons**: Go to **Offers** → Add active discount codes (e.g., *"10% OFF on bill over ₹1,000"*).
6. **Enroll Your First Member**: Go to **Add Member** → Enter customer details and hand them a linked physical card or share their digital QR link!

---

## 🔍 Comprehensive Feature-by-Feature Guide

### 1. Dashboard & Analytics
- **Location**: `Merchant Dashboard -> Home / Overview`
- **Key Features**:
  - **KPI Metrics**: View Total Members, Total Visits Logged, Points Issued This Month, and Monthly Revenue generated from loyalty transactions.
  - **Quick Action Bar**: Instant buttons for *Scan Card*, *Add Member*, *Record Visit*, and *Issue Reward*.
  - **Recent Activity Stream**: Real-time log showing recent member visits, point credits, and reward redemptions.

### 2. Search Member & Point Scanning (Core Operation)
- **Location**: `Merchant Dashboard -> Search Member`
- **Key Features**:
  - **Multi-Method Lookup**: Search members by **Name**, **Phone Number**, **Card Number**, or **QR Code**.
  - **QR Code Camera Scanner**: Built-in html5 scanner uses your phone, tablet, or webcam to scan customer card QRs instantly.
  - **Image File Upload Scanner**: Upload a photo of a QR code if the camera is unavailable.
  - **Member Instant Summary**: Displays active tier badge, live points balance, total lifetime visits, and total money spent.

### 3. Add Member & Onboarding
- **Location**: `Merchant Dashboard -> Add Member`
- **Key Features**:
  - **Customer Details Form**: Capture Name, Mobile Number, Email, Birthday, and Anniversary date.
  - **Tier Assignment**: Assign initial tier (Silver, Gold, Platinum, VIP).
  - **Referral Code Attribution**: Enter a referring friend's referral code to instantly credit referral points (default: 50 points) to the friend.

### 4. Members Directory & Tier Management
- **Location**: `Merchant Dashboard -> Members`
- **Key Features**:
  - **Filter & Search**: Filter members by Tier, Status (Active/Inactive), or date enrolled.
  - **Member Profile Drawer**: Click any member to open their complete history, edit details, adjust points manually, or view issued vouchers.
  - **Export Data**: Download member list as CSV for external marketing.

### 5. Physical Card Inventory & QR Linking
- **Location**: `Merchant Dashboard -> Card Inventory`
- **Key Features**:
  - **Card Batch Management**: Track physical pre-printed plastic NFC/QR cards allocated to your store.
  - **Link Card to Member**: Select an unassigned card, type or scan its QR code, and link it to an enrolled member's account.
  - **Status Tracking**: Track cards marked as *Available*, *Assigned*, or *Damaged*.

### 6. Membership Tiers Configuration
- **Location**: `Merchant Dashboard -> Membership Tiers`
- **Key Features**:
  - **Tier Rules**: Define visit or spend thresholds required to reach Silver, Gold, or Platinum.
  - **Tier Perks**: Set bonus multipliers (e.g., Gold members earn 1.25x points; Platinum members earn 1.5x points).

### 7. Rewards & Points Engine
- **Location**: `Merchant Dashboard -> Rewards`
- **Key Features**:
  - **Points Rules**:
    - *Per Visit*: Award a fixed point bonus per visit (e.g., 20 flat points).
    - *Per Rupee*: Award proportional points based on spending (e.g., 1 point per ₹10 spent).
  - **Reward Catalog**: Manage redeemable rewards (Name, Description, Points Cost, Stock Count).
  - **Scratch Cards**: Configure automated digital scratch cards awarded on milestone visits (e.g., 5th visit, 10th visit).
  - **Lucky Draws**: Create raffle events with minimum point/visit entry criteria and draw random winners.

### 8. Promotional Offers & Coupons
- **Location**: `Merchant Dashboard -> Offers`
- **Key Features**:
  - **Create Coupon**: Set Percentage Discount (e.g. 15% off) or Flat Discount (e.g. ₹200 off).
  - **Usage Constraints**: Set Minimum Bill Amount, Start/End Dates, Total Usage Limit, and Per-Member Limit.

### 9. Automated Campaigns & Broadcasts
- **Location**: `Merchant Dashboard -> Campaigns`
- **Key Features**:
  - **Trigger Rules**: Set up background automation for:
    - *Birthday Greetings*: Auto-send greeting + coupon X days before birthday.
    - *Anniversary Alerts*: Reward customers on enrollment anniversaries.
    - *Membership Expiry Warnings*: Alert customers before their tier status expires.
    - *Point Milestone Pushes*: Notify members close to unlocking a reward (e.g., *"You're only 50 points away!"*).
  - **Broadcast SMS/WhatsApp**: Send bulk promotional messages to targeted customer tiers.

### 10. Business Reports & Insights
- **Location**: `Merchant Dashboard -> Reports`
- **Key Features**:
  - **Points Health**: Total points issued vs total points redeemed vs active points liability.
  - **Customer Retention Analytics**: Repeat visit frequency, customer lifetime value (LTV), and churn rates.
  - **Offer Performance**: Track which coupons drive the highest ticket sizes.

### 11. Merchant Settings & Customization
- **Location**: `Merchant Dashboard -> Settings`
- **Key Features**:
  - Store Profile, Logo Upload, Business WhatsApp Number configuration, Default Referral Bonus setup, and Password/Security settings.

---

## ⚡ "Every Point Scanning" Operating Procedures

"Every Point Scanning" represents the core daily operational workflow when a customer stands at your store cash counter.

```
                  ┌─────────────────────────────────────────┐
                  │ Customer Arrives at Counter with Card/QR│
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       [ Option A: Camera Scan ]                    [ Option B: Manual Search ]
  Point cashier camera at card QR               Type Name, Phone, or Card ID
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │ Member Profile Loaded & Verified│
                       └───────────────┬──────────────┘
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │   Click "Record Visit"       │
                       │ 1. Enter Total Bill Amount   │
                       │ 2. Select Active Coupon      │
                       │ 3. Click Confirm             │
                       └───────────────┬──────────────┘
                                       │
                                       ▼
         ┌────────────────────────────────────────────────────────────┐
         │ System Action:                                             │
         │ • Calculates points earned using active Points Rules      │
         │ • Applies Tier Multiplier (if applicable)                 │
         │ • Credits points to member's live balance                  │
         │ • Logs immutable audit entry in Loyalty History            │
         │ • Checks milestone thresholds & auto-issues scratch card  │
         └────────────────────────────────────────────────────────────┘
```

### A. Live Camera Scanning
1. Open **Search Member** on your phone, tablet, or desktop web browser.
2. Select the **Scan QR** tab.
3. Grant camera permissions if prompted.
4. Align the customer's physical card QR code within the on-screen viewfinder box.
5. Upon detection, the scanner automatically reads the embedded `public_token`, plays a success chime, and opens the member's profile.

### B. Photo / Image Upload Scanning
1. If the store device camera is disabled or obstructed, click **Upload QR Image**.
2. Take a photo of the card QR using the device camera or select a photo from your gallery.
3. The built-in scanner decodes the image instantly and redirects to the member's profile.

### C. Manual Lookup Fallback
1. If the customer forgot their physical card, click the **Manual Search** tab in **Search Member**.
2. Type their **Mobile Number** or **First Name**.
3. Select the matching customer profile from the instant dropdown results.

### D. Visit Recording & Point Accrual Math
1. On the member's profile, click **Record Visit**.
2. Enter the final **Bill Amount** (e.g. ₹1,200).
3. If the customer wishes to apply an eligible coupon, select it from the dropdown.
4. Click **Confirm & Issue Points**.
5. **How Points are Computed**:
   - *Example 1 (Per Visit Rule)*: Configured for 20 points per visit. The customer earns **20 flat points**.
   - *Example 2 (Per Rupee Rule)*: Configured for 1 point per ₹10 spent on a ₹1,200 bill. The customer earns **120 points**.
   - *Example 3 (Tier Bonus)*: A Gold Member with a 1.25x multiplier earning 120 base points receives **150 points total**.

### E. Claiming & Deducting Rewards
1. When a customer wants to spend points for a reward (e.g., "Free Coffee - 200 Points"):
2. Navigate to **Claim Reward** on their profile.
3. Verify their live points balance is sufficient (`Balance >= Points Cost`).
4. Click **Claim Reward**. The system instantly deducts 200 points from their balance, logs a `-200` transaction entry in their audit history, and updates reward stock.

---

## 📱 Customer Portal (Public Member Pass)

Customers do **not** need to download any app from the App Store or Play Store. Scanning their card QR code or opening their personal pass link (`https://metrocardz.in/m/{public_token}`) displays their digital pass:

- **Live Points Counter**: Displays current points balance and current tier status (Silver, Gold, Platinum).
- **Rewards Progress Bar**: Shows how many points are needed to unlock the next catalog reward.
- **Active Offers & Vouchers**: Displays available discount codes ready to show to the store cashier.
- **Milestone Scratch Cards**: Interactive digital scratch cards that customers rub on screen to reveal bonus points or free gifts.
- **WhatsApp Referral Button**: One-tap button that opens WhatsApp with a pre-formatted message and referral link:
  > *"Hey! Join Metro Cardz at [Store Name] using my referral link: https://metrocardz.in/m/REF12345 to get bonus points!"*

---

## ❓ Troubleshooting & FAQ

#### Q1: What if the camera scanner fails to read a QR code?
- Ensure proper store lighting without heavy glare on the plastic card surface.
- Use the **Upload QR Photo** button as an instant fallback.
- Alternatively, search by the customer's phone number or 8-character card serial number.

#### Q2: Can points be adjusted manually if a cashier made a mistake?
- Yes. Go to **Members** → Click the member → Open **Adjust Points**. Select *Add Points* or *Deduct Points*, type the point value, and add a mandatory operational reason note (e.g., *"Refund adjustment for Bill #1042"*).

#### Q3: What happens when a member earns enough points/visits to reach a higher tier?
- The system automatically upgrades their status (e.g., Silver → Gold) as soon as the threshold transaction is confirmed, unlocking higher point multiplier rates immediately.

---
*Metro Cardz Operational Manual — Updated for Version 2.0*
