# Metro Cardz — Production Deployment Guide

Deploy your entire loyalty card platform for **₹0** in hosting costs using secure, premium free-tier cloud services.

---

## 📋 Table of Contents
1. [Setup Database & Execute Migrations (Supabase)](#1-setup-database--execute-migrations-supabase)
2. [Setup Cache & Rate-Limiter (Upstash Redis)](#2-setup-cache--rate-limiter-upstash-redis)
3. [Configure Google Cloud OAuth App](#3-configure-google-cloud-oauth-app)
4. [Configure SendGrid Email Deliverability](#4-configure-sendgrid-email-deliverability)
5. [Deploy Backend API (Render.com)](#5-deploy-backend-api-rendercom)
6. [Configure Keep-Alive & Cron Reminders (GitHub Actions)](#6-configure-keep-alive--cron-reminders-github-actions)
7. [Deploy Frontend Static Website (Hostinger or Vercel)](#7-deploy-frontend-static-website-hostinger-or-vercel)

---

## 1. Setup Database & Execute Migrations (Supabase)

1. Sign up on [Supabase](https://supabase.com) and click **New Project**.
   - Name: `metrocardz`
   - Region: **Southeast Asia (Singapore)** (closest to India, lowest latency)
   - Plan: **Free**
2. Go to **Project Settings** (gear icon) → **Database** → **Connection String** → Select the **Pooler** tab.
3. Make sure the Mode is set to **Session** (highly recommended for FastAPI). Copy the connection URI:
   ```text
   postgresql://postgres.dyzjsykvziquqsadnqzu:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   *Keep this as your `DATABASE_URL`.*

### 🛠️ Run SQL Schema Migrations
Since running Python shell migrations dynamically on free-tier containers can be slow, execute this clean, combined SQL block directly in the **Supabase SQL Editor** (Click **New Query** → Paste → Click **Run**):

```sql
-- ── 1. RENAME WALLET BALANCE TO LOYALTY POINTS ──
ALTER TABLE members RENAME COLUMN wallet_balance TO loyalty_points;

-- ── 2. ADD EMAIL TO MERCHANT USERS FOR GOOGLE OAUTH ──
ALTER TABLE merchant_users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ix_merchant_users_email ON merchant_users(email);

-- ── 3. EXTEND MERCHANTS WITH APPROVAL WORKFLOW & REFERRAL BONUS ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_approval_status') THEN
        CREATE TYPE merchant_approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS approval_status merchant_approval_status NOT NULL DEFAULT 'approved';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referral_bonus_points NUMERIC(10,2) DEFAULT 50.00;

-- ── 4. EXTEND MEMBERS WITH NOTES, VISITS, AND REFERRAL FK ──
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_visits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ix_members_referral_code ON members(referral_code);

ALTER TABLE members ADD COLUMN IF NOT EXISTS referred_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL;

-- ── 5. EXTEND OFFER TEMPLATES WITH CONSTRAINTS & POINTS ECONOMY ──
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS loyalty_points_earn NUMERIC(10,2);
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS is_points_redemption BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS loyalty_points_cost NUMERIC(10,2);
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS min_visits INTEGER;
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS min_purchase_amount NUMERIC(10,2);

-- Add points_redemption to offer_type enum
ALTER TYPE offer_type ADD VALUE IF NOT EXISTS 'points_redemption';

-- ── 6. CREATE LOYALTY TRANSACTIONS AUDIT TABLE ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tx_type') THEN
        CREATE TYPE loyalty_tx_type AS ENUM ('earn', 'redeem', 'referral_bonus');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id VARCHAR PRIMARY KEY,
    member_id VARCHAR NOT NULL REFERENCES members(id) ON delete CASCADE,
    merchant_id VARCHAR NOT NULL REFERENCES merchants(id) ON delete CASCADE,
    type loyalty_tx_type NOT NULL,
    points NUMERIC NOT NULL,
    source_redemption_id VARCHAR REFERENCES redemption_log(id) ON delete SET NULL,
    source_offer_id VARCHAR REFERENCES offer_templates(id) ON delete SET NULL,
    balance_after NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_loyalty_tx_member_created ON loyalty_transactions(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_loyalty_tx_merchant_created ON loyalty_transactions(merchant_id, created_at DESC);

-- ── 7. ADD CONF-TIMING TO REMINDER RULES ──
ALTER TABLE reminder_rules ADD COLUMN IF NOT EXISTS send_time TIME;
ALTER TABLE reminder_rules ADD COLUMN IF NOT EXISTS days_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reminder_rules ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

UPDATE reminder_rules SET days_before = 7 WHERE trigger_type = 'expiry';
UPDATE reminder_rules SET send_time = '09:00:00' WHERE send_time IS NULL;

-- ── 8. CREATE PERFORMANCE TUNING INDEXES ──
CREATE INDEX IF NOT EXISTS idx_members_merchant_phone ON members(merchant_id, phone);
CREATE INDEX IF NOT EXISTS idx_members_merchant_status ON members(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_member_created ON redemption_log(member_id, created_at DESC);

-- ── 9. SET SUPER ADMIN EMAIL FOR GOOGLE LOGIN ──
-- Replace with your actual Google account email
UPDATE merchant_users SET email = 'your-admin-email@gmail.com' WHERE role = 'super_admin';
```

---

## 2. Setup Cache & Rate-Limiter (Upstash Redis)

Render does not offer a free Redis service. Upstash provides a highly reliable, free, serverless Redis tier.

1. Go to [Upstash](https://upstash.com) and log in.
2. Create a **Redis Database**:
   - Name: `metrocardz-redis`
   - Region: **AP-Southeast-1 (Singapore)** (matches your Supabase region for low latency)
3. Copy the **Redis URL** shown under the REST API / Node connection section. It will look like this:
   ```text
   redis://default:[token]@powerful-aardvark-116938.upstash.io:6379
   ```
   *Keep this as your `REDIS_URL`.*

---

## 3. Configure Google Cloud OAuth App

Google Login is used to authenticate platform users instead of OTP.

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a project named `Metro Cardz`.
3. Go to **APIs & Services** → **OAuth consent screen**:
   - User Type: **External**
   - App name: `Metro Cardz`
   - User support email: *Your email*
   - Developer contact email: *Your email*
   - Click **Save and Continue** until complete.
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Metro Cardz Frontend`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (Local testing)
     - `https://metrocardz.in` (Production domain)
   - Authorized redirect URIs:
     - `https://[your-supabase-project-id].supabase.co/auth/v1/callback`
5. Click **Create** and copy the Client ID and Client Secret.
6. Open your **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:
   - Toggle **Enabled**: `ON`
   - Client ID: *Your Google Client ID*
   - Client Secret: *Your Google Client Secret*
   - Click **Save**.

---

## 4. Configure SendGrid Email Deliverability

The app uses SendGrid to send emails like customer birthday, anniversary, or expiry alerts.

1. Sign up on [SendGrid](https://sendgrid.com) (free tier includes 100 emails/day).
2. Go to **Settings** → **Sender Authentication** and verify your domain (e.g. `metrocardz.in`) or single sender email (e.g. `noreply@metrocardz.in`).
3. Go to **API Keys** → **Create API Key**. Copy the key.
   *Keep this as your `SENDGRID_API_KEY`.*

---

## 5. Deploy Backend API (Render.com)

1. Sign up on [Render.com](https://render.com) and link your GitHub account.
2. Click **New +** → **Web Service**. Connect your `metrocardz` repository.
3. Configure the Web Service:
   - Name: `metrocardz-api`
   - Language: `Python`
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - Instance Type: **Free**
4. Click **Advanced** and add the following **Environment Variables**:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = *(Supabase Pooler URI from Section 1)*
   - `REDIS_URL` = *(Upstash URL from Section 2)*
   - `SECRET_KEY` = *(Random hex string, e.g. `f1b40de921b790...`)*
   - `ALLOWED_ORIGINS` = `https://metrocardz.in,https://www.metrocardz.in`
   - `SUPABASE_URL` = `https://[your-supabase-id].supabase.co`
   - `SUPABASE_SERVICE_KEY` = *(Supabase service_role key from API settings)*
   - `SENDGRID_API_KEY` = *(SendGrid key from Section 4)*
   - `SENDGRID_FROM_EMAIL` = `noreply@metrocardz.in` *(Your verified SendGrid sender)*
   - `INTERNAL_CRON_KEY` = *(Create a random token, e.g., `cron-sec-72d8a`)*
   - `SUPER_ADMIN_PHONE` = `9000000000` *(Primary admin log phone)*
   - `SUPER_ADMIN_NAME` = `Admin`
5. Click **Deploy Web Service**. Wait for the build to pass. Render will provide your API endpoint:
   ```text
   https://metrocardz-api.onrender.com
   ```
   *Keep this as your `NEXT_PUBLIC_API_BASE_URL`.*

---

## 6. Configure Keep-Alive & Cron Reminders (GitHub Actions)

Free Render web services go to sleep after 15 minutes of inactivity. We keep the API awake and trigger the reminder engine hourly using GitHub Actions.

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**:
2. Add the following **Repository Secrets**:
   - `RENDER_CRON_KEY` = *(The `INTERNAL_CRON_KEY` you configured in Render env vars)*
   - `RENDER_HEALTH_URL` = `https://metrocardz-api.onrender.com/health`
   - `RENDER_REMINDER_URL` = `https://metrocardz-api.onrender.com/internal/run-reminders`
3. Commit and push the `.github/workflows/` directory to GitHub. The workflows will trigger automatically in the background.

---

## 7. Deploy Frontend Static Website (Hostinger or Vercel)

### Option A: Hostinger Shared Hosting (Recommended)

1. Open your local code. Navigate to the `app` directory.
2. Open `app/.env.local` and configure your production environment variables:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://metrocardz-api.onrender.com
   NEXT_PUBLIC_USE_MOCK_DATA=false
   NEXT_PUBLIC_SUPABASE_URL=https://[your-supabase-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
   ```
3. Run the export build in your terminal:
   ```bash
   cd app
   npm run build
   ```
   *This compiles your Next.js application into a 100% static folder named `out`.*
4. Log into your **Hostinger hPanel** → **File Manager** for your domain (`metrocardz.in`).
5. Open the `public_html` directory.
6. Delete any placeholder files.
7. Upload the entire **contents** of your local `app/out` folder directly into `public_html`.
8. *Done! Your site is live at `https://metrocardz.in`.*

### Option B: Deploy to Vercel (Auto-deploys)

1. Create a project on [Vercel](https://vercel.com) and link your GitHub repo.
2. Set the **Root Directory** to `app`.
3. Add the **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://metrocardz-api.onrender.com`
   - `NEXT_PUBLIC_USE_MOCK_DATA` = `false`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://[your-supabase-id].supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *anon key*
4. Click **Deploy**. Vercel will build and host your app.
5. In Vercel Project Settings → **Domains**, add your custom domain `metrocardz.in` and configure the CNAME/A records.