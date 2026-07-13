# Metro Cardz — Free Deployment Guide

> Deploy your entire application for **₹0** using premium free-tier cloud services.
> No code changes required.

---

## 1. Setup the Database (Supabase) — 5 Mins

1. Go to [supabase.com](https://supabase.com) and sign up with GitHub or Email.
2. Click **New Project**.
   - Name: `metrocardz`
   - Database Password: Create a strong password (write it down!)
   - Region: **Southeast Asia (Singapore)** (closest to India, lowest latency)
   - Plan: **Free**
3. Click **Create new project**. Wait 2 minutes for it to provision.
4. Go to **Project Settings** (gear icon) → **Database** → **Connection String** → select **URI**.
5. Copy the connection string. It will look like this:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password you created in step 2.
   *This is your `DATABASE_URL`.*

---

## 2. Setup Free Redis (Upstash) — 3 Mins

*Render does not have a free Redis tier anymore, so we use Upstash (which is 100% free and very fast).*

1. Go to [upstash.com](https://upstash.com) and sign up.
2. Click **Create Database**.
   - Name: `metrocardz-redis`
   - Type: **Redis**
   - Region: **ap-southeast-1 (Singapore)** (to match your database location)
3. Click **Create**.
4. Scroll down to the **Endpoint** section and copy the **Redis URL** (starts with `redis://` or `rediss://`).
   *This is your `REDIS_URL`.*

---

## 3. Deploy the Backend (Render.com) — 7 Mins

1. Push your code to a **GitHub repository** (private or public).
2. Go to [render.com](https://render.com) and sign up.
3. Click **New +** → **Web Service**.
4. Connect your GitHub account and select your `metrocardz` repository.
5. Configure the Web Service settings:
   - **Name**: `metrocardz-api`
   - **Language**: `Python`
   - **Branch**: `main` (or whichever branch has your code)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Instance Type**: **Free**
6. Click **Advanced** and add the following **Environment Variables**:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = *(Your Supabase connection URI from Part 1)*
   - `REDIS_URL` = *(Your Upstash Redis URL from Part 2)*
   - `SECRET_KEY` = *(Create a random text, e.g., `python -c "import secrets; print(secrets.token_hex(32))"`)*
   - `ALLOWED_ORIGINS` = `https://metrocardz.in,https://www.metrocardz.in`
   - `SUPER_ADMIN_PHONE` = *(Your phone number to log in)*
   - `SUPER_ADMIN_NAME` = `Admin`
7. Click **Create Web Service**. 
8. Render will build and deploy the backend. Once active, it will give you a URL (e.g. `https://metrocardz-api.onrender.com`).
   *This is your `NEXT_PUBLIC_API_BASE_URL`.*

---

## 4. Deploy the Frontend (Next.js)

You can deploy the frontend either on your existing **Hostinger Shared Hosting** (recommended since you already have the domain set up there) or on **Vercel** (easier automatic deploys).

### Option A: Upload to Hostinger (Recommended)

1. Open your local code. Open `app/.env.local` or create `app/.env.production.local` and set:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://metrocardz-api.onrender.com
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```
   *(Replace with your actual Render API URL)*
2. In your terminal, run:
   ```bash
   cd app
   npm run build
   ```
3. This creates an `out` folder inside the `app` directory. This folder contains your static website.
4. Go to **Hostinger hPanel** → **File Manager** for `metrocardz.in`.
5. Open the `public_html` folder.
6. Delete any default files inside `public_html`.
7. Upload all contents of your local `app/out` folder directly into `public_html`.
8. *Done! Your website is now live at `https://metrocardz.in` and connected to the free cloud database and backend.*

### Option B: Deploy to Vercel (Automatic Deploys)

1. Go to [vercel.com](https://vercel.com) and sign up.
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `app`.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://metrocardz-api.onrender.com`
   - `NEXT_PUBLIC_USE_MOCK_DATA` = `false`
6. Click **Deploy**.
7. Go to Vercel Project Settings → **Domains** → Add your custom domain `metrocardz.in`.
8. Follow Vercel's instructions to point your DNS to Vercel (takes 2 minutes).
