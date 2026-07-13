# Metro Cardz — Step-by-Step VPS Deployment

> Copy-paste every command. Run them in order. Nothing skipped.  
> **Time required:** ~60–90 minutes (first time)

---

## Before You Start — What You Need Ready

Collect these before starting:

```
□ VPS IP address      → from Hostinger hPanel → VPS
□ VPS root password   → from Hostinger hPanel → VPS
□ Your domain         → metrocardz.in
□ A DB password       → you create this in Step 5 (write it down)
□ A SECRET_KEY        → we generate this in Step 7
□ Your code           → on GitHub OR on your Windows PC
```

---

## STEP 1 — Get Your VPS IP and Password

1. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Click **VPS** in the left menu
3. Click **Manage** on your Business VPS
4. You will see:
   - **IP Address** — looks like `123.45.67.89`
   - **Root Password** — click "Reset root password" if you don't have it
5. Write these down.

---

## STEP 2 — Connect to Your VPS from Windows

Open **Windows Terminal** (or PowerShell) and run:

```powershell
ssh root@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with your actual IP (e.g. `123.45.67.89`).

When asked:
```
Are you sure you want to continue connecting? → type: yes
root@YOUR_VPS_IP's password: → paste your root password
```

✅ You should now see a prompt like: `root@vps-xxxx:~#`

---

## STEP 3 — Update the Server and Create a Safe User

Run these commands one by one. Wait for each to finish.

```bash
# Update all packages
apt update && apt upgrade -y
```

```bash
# Create a deploy user (never run your app as root)
adduser deploy
```

It will ask for a password — set one and remember it. Press Enter to skip the name/room/phone fields.

```bash
# Give deploy user sudo access
usermod -aG sudo deploy
```

```bash
# Switch to the deploy user for the rest of the setup
su - deploy
```

✅ Your prompt should now show: `deploy@vps-xxxx:~$`

---

## STEP 4 — Install All Required Software

```bash
# Install system packages
sudo apt install -y git curl wget build-essential libpq-dev nginx certbot python3-certbot-nginx redis-server
```

```bash
# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

```bash
# Verify Python version
python3.11 --version
# Should print: Python 3.11.x
```

```bash
# Install Node.js 20 (for building the frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

```bash
# Verify Node.js
node --version
# Should print: v20.x.x
npm --version
# Should print: 10.x.x
```

```bash
# Start Redis and enable it on boot
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

```bash
# Test Redis works
redis-cli ping
# Should print: PONG
```

✅ All software installed.

---

## STEP 5 — Install PostgreSQL and Create the Database

> Running PostgreSQL locally on your VPS. Costs ₹0 extra. Uses ~500 MB of your 200 GB disk.

### 5.1 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

```bash
# Start PostgreSQL and enable on boot
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

```bash
# Verify it is running
sudo systemctl status postgresql | grep Active
# Should show: Active: active (running)
```

### 5.2 Create the Database and User

```bash
# Open the PostgreSQL console as the postgres admin user
sudo -u postgres psql
```

You are now inside psql. You will see: `postgres=#`

Run these commands **inside psql** (copy-paste each line, press Enter after each):

```sql
CREATE DATABASE metrocardz;
```

```sql
CREATE USER metrocardz_user WITH ENCRYPTED PASSWORD 'CHOOSE_A_STRONG_PASSWORD';
```

> ⚠️ Replace `CHOOSE_A_STRONG_PASSWORD` with your own password. Write it down — you need it in Step 8.

```sql
GRANT ALL PRIVILEGES ON DATABASE metrocardz TO metrocardz_user;
```

```sql
-- PostgreSQL 15+ requires this extra grant
\c metrocardz
GRANT ALL ON SCHEMA public TO metrocardz_user;
```

```sql
-- Exit psql
\q
```

### 5.3 Test the Connection

```bash
psql -h localhost -U metrocardz_user -d metrocardz -c "SELECT 1;"
```

Enter your password when asked. Should print:
```
 ?column?
----------
        1
(1 row)
```

✅ Database is ready. Your `DATABASE_URL` is:
```
postgresql://metrocardz_user:YOUR_PASSWORD@localhost:5432/metrocardz
```
**Write this down — you need it in Step 8.**

---

## STEP 6 — Create the App Directory and Upload Your Code

### Option A — If your code is on GitHub (recommended):

```bash
# Create the app directory
sudo mkdir -p /var/www/metrocardz
sudo chown deploy:deploy /var/www/metrocardz

# Clone your repository
cd /var/www/metrocardz
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
```

Replace with your actual GitHub URL.

### Option B — If code is only on your Windows machine:

Open a **second PowerShell window** on your Windows PC (keep the SSH session open in the first window):

```powershell
# Run this on your WINDOWS PC (second terminal window)
# This uploads the entire metrocard folder to the VPS
scp -r "c:\work\metrocard\*" deploy@YOUR_VPS_IP:/var/www/metrocardz/
```

Wait for it to finish (may take 2-5 minutes).

Back in your SSH session (first window):
```bash
# Verify files are there
ls /var/www/metrocardz/
# Should show: app  backend  .github  Metro_Cardz_*.md  etc.
```

---

## STEP 7 — Generate Your SECRET_KEY

```bash
python3.11 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output. It will look like:
```
a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**Save this — you need it in the next step.**

---

## STEP 8 — Configure the Backend Environment

```bash
cd /var/www/metrocardz/backend
```

```bash
# Create the environment file
nano .env
```

The nano editor opens. **Paste this entire block** and fill in your values:

```env
ENVIRONMENT=production
DEBUG=false
APP_NAME=Metro Cardz API
APP_VERSION=1.0.0

# Local PostgreSQL — running on this same VPS
DATABASE_URL=postgresql://metrocardz_user:YOUR_DB_PASSWORD@localhost:5432/metrocardz

# Local Redis — running on this same VPS
REDIS_URL=redis://localhost:6379

SECRET_KEY=PASTE_YOUR_GENERATED_KEY_HERE
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

ALLOWED_ORIGINS=https://metrocardz.in,https://www.metrocardz.in

# Supabase Storage (optional — for logo/image uploads)
# Leave blank for now, add later if needed
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
STORAGE_BUCKET=metrocardz-assets

MSG91_API_KEY=
MSG91_SENDER_ID=METRCZ
MSG91_TEMPLATE_ID_OTP=

AISENSY_API_KEY=
AISENSY_CAMPAIGN_NAME=metrocardz_reminder

SENTRY_DSN=

# Change this to YOUR phone number — this is how you log in first time
SUPER_ADMIN_PHONE=9000000000
SUPER_ADMIN_NAME=Metro Cardz Admin
```

To save in nano:
- Press `Ctrl + O` → then `Enter` (saves)
- Press `Ctrl + X` (exits)

```bash
# Lock down the file so only deploy user can read it
chmod 600 /var/www/metrocardz/backend/.env
```

---

## STEP 9 — Install Python Dependencies and Run Migrations

```bash
cd /var/www/metrocardz/backend
```

```bash
# Create Python virtual environment
python3.11 -m venv venv
```

```bash
# Activate it
source venv/bin/activate
```

Your prompt should now show `(venv)` at the start.

```bash
# Install all Python packages
pip install --upgrade pip
pip install -r requirements.txt
```

Wait for this to finish (~2 minutes).

```bash
# Run database migrations (creates all tables in Supabase)
alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> abc123, initial schema
INFO  [alembic.runtime.migration] Running upgrade abc123 -> def456, add loyalty
```

✅ Database is ready.

---

## STEP 10 — Test the Backend Manually

```bash
# Still inside (venv), from /var/www/metrocardz/backend
gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
```

Open a **second SSH session** (new terminal window, SSH in again as deploy) and test:

```bash
curl http://127.0.0.1:8000/health
```

Should print:
```json
{"status":"ok"}
```

Go back to the first window → press `Ctrl + C` to stop Gunicorn.

✅ Backend works.

---

## STEP 11 — Make the Backend Run Permanently (systemd service)

```bash
# Create log directory
sudo mkdir -p /var/log/metrocardz
sudo chown deploy:deploy /var/log/metrocardz
```

```bash
sudo nano /etc/systemd/system/metrocardz-api.service
```

Paste this exactly:

```ini
[Unit]
Description=Metro Cardz FastAPI API
After=network.target
Wants=redis.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/metrocardz/backend
EnvironmentFile=/var/www/metrocardz/backend/.env
ExecStart=/var/www/metrocardz/backend/venv/bin/gunicorn \
    app.main:app \
    -w 3 \
    -k uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --preload \
    --worker-connections 1000 \
    --access-logfile /var/log/metrocardz/api-access.log \
    --error-logfile /var/log/metrocardz/api-error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
sudo nano /etc/systemd/system/metrocardz-worker.service
```

Paste this:

```ini
[Unit]
Description=Metro Cardz Celery Worker
After=network.target
Wants=redis.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/metrocardz/backend
EnvironmentFile=/var/www/metrocardz/backend/.env
ExecStart=/var/www/metrocardz/backend/venv/bin/celery \
    -A app.worker.celery_app worker \
    --loglevel=info \
    --concurrency=2 \
    --logfile=/var/log/metrocardz/celery-worker.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
sudo nano /etc/systemd/system/metrocardz-beat.service
```

Paste this:

```ini
[Unit]
Description=Metro Cardz Celery Beat Scheduler
After=network.target
Wants=redis.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/metrocardz/backend
EnvironmentFile=/var/www/metrocardz/backend/.env
ExecStart=/var/www/metrocardz/backend/venv/bin/celery \
    -A app.worker.celery_app beat \
    --loglevel=info \
    --logfile=/var/log/metrocardz/celery-beat.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Load the new service files
sudo systemctl daemon-reload

# Enable all 3 services (auto-start on reboot)
sudo systemctl enable metrocardz-api metrocardz-worker metrocardz-beat

# Start all 3 services
sudo systemctl start metrocardz-api metrocardz-worker metrocardz-beat
```

```bash
# Check they are all running
sudo systemctl status metrocardz-api
sudo systemctl status metrocardz-worker
sudo systemctl status metrocardz-beat
```

Each should show: `Active: active (running)` ✅

---

## STEP 12 — Build and Deploy the Frontend

```bash
cd /var/www/metrocardz/app
```

```bash
# Install Node dependencies
npm install
```

```bash
# Create the production environment file
nano .env.production.local
```

Paste this (replace your Sentry DSN if you have one):

```env
NEXT_PUBLIC_API_BASE_URL=https://api.metrocardz.in
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_NAME=Metro Cardz
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_BASE_URL=https://metrocardz.in
NEXT_PUBLIC_ENABLE_SENTRY=false
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Build the Next.js app (takes 2-4 minutes)
npm run build
```

When it finishes, you should see:
```
✓ Generating static pages (XX/XX)
✓ Exporting (XX/XX)
Route (app)  Size  First Load JS
...
```

```bash
# Deploy built files to the web root
sudo mkdir -p /var/www/metrocardz/frontend
sudo cp -r out/. /var/www/metrocardz/frontend/
sudo chown -R www-data:www-data /var/www/metrocardz/frontend
```

---

## STEP 13 — Configure Nginx (Web Server)

```bash
# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default
```

```bash
sudo nano /etc/nginx/sites-available/metrocardz-frontend
```

Paste this:

```nginx
server {
    listen 80;
    server_name metrocardz.in www.metrocardz.in;

    root /var/www/metrocardz/frontend;
    index index.html;

    # Static asset caching (JS/CSS/images)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing — all paths go to index.html
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
sudo nano /etc/nginx/sites-available/metrocardz-api
```

Paste this:

```nginx
server {
    listen 80;
    server_name api.metrocardz.in;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }
}
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Enable both sites
sudo ln -s /etc/nginx/sites-available/metrocardz-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/metrocardz-api /etc/nginx/sites-enabled/

# Test the Nginx config for syntax errors
sudo nginx -t
# Should print: nginx: configuration file test is successful

# Reload Nginx
sudo systemctl reload nginx
```

---

## STEP 14 — Point Your Domain to the VPS

Go to **Hostinger hPanel → Domains → DNS Zone** for `metrocardz.in`.

Delete any existing A records for `@`, `www`, and `api`.

Add these 3 records:

| Type | Name | Value (Points to) | TTL |
|---|---|---|---|
| A | `@` | `YOUR_VPS_IP` | 3600 |
| A | `www` | `YOUR_VPS_IP` | 3600 |
| A | `api` | `YOUR_VPS_IP` | 3600 |

Click **Save**. DNS changes take 5–30 minutes to propagate.

---

## STEP 15 — Install Free SSL Certificate

Wait until your DNS has propagated (test at [dnschecker.org](https://dnschecker.org) — search `metrocardz.in`).

Then run:

```bash
sudo certbot --nginx \
  -d metrocardz.in \
  -d www.metrocardz.in \
  -d api.metrocardz.in \
  --email YOUR_EMAIL@gmail.com \
  --agree-tos \
  --non-interactive
```

Replace `YOUR_EMAIL@gmail.com` with your real email.

Certbot automatically:
- Issues the SSL certificate
- Updates your Nginx configs to use HTTPS
- Sets up auto-renewal every 90 days

```bash
# Test auto-renewal works
sudo certbot renew --dry-run
# Should print: Congratulations, all simulated renewals succeeded
```

---

## STEP 16 — Final Verification

```bash
# Check all services are running
sudo systemctl status metrocardz-api | grep Active
sudo systemctl status metrocardz-worker | grep Active
sudo systemctl status metrocardz-beat | grep Active
sudo systemctl status nginx | grep Active
sudo systemctl status redis-server | grep Active
```

All should show: `active (running)` ✅

```bash
# Test the API directly
curl https://api.metrocardz.in/health
# Should print: {"status":"ok"}
```

```bash
# Test the frontend
curl -I https://metrocardz.in
# Should print: HTTP/2 200
```

Open in browser:
```
https://metrocardz.in          → Login screen should appear
https://api.metrocardz.in/health → {"status":"ok"}
```

---

## STEP 17 — Log In for the First Time

The app creates the super admin account from your `.env` values:
- `SUPER_ADMIN_PHONE=9000000000` (change this to your phone)
- `SUPER_ADMIN_NAME=Metro Cardz Admin`

Open `https://metrocardz.in` → enter your phone number → get OTP → log in.

> If OTP doesn't arrive: MSG91 API key is not set yet. For now, check the API logs:
> ```bash
> tail -f /var/log/metrocardz/api-access.log
> ```
> The OTP will be printed to the log in development mode.

---

## STEP 18 — Reboot Test (Optional but important)

Reboot the server and verify everything comes back up automatically:

```bash
sudo reboot
```

Wait 30 seconds, SSH back in:

```bash
ssh deploy@YOUR_VPS_IP
```

```bash
sudo systemctl status metrocardz-api metrocardz-worker metrocardz-beat nginx redis-server
```

All should be `active (running)` without you doing anything. ✅

---

## Quick Reference — Daily Commands

```bash
# View live API logs
tail -f /var/log/metrocardz/api-access.log

# View API errors
tail -f /var/log/metrocardz/api-error.log

# View background worker logs
tail -f /var/log/metrocardz/celery-worker.log

# Restart API (after a code update)
sudo systemctl restart metrocardz-api

# Restart everything
sudo systemctl restart metrocardz-api metrocardz-worker metrocardz-beat

# Check RAM usage
free -h

# Check disk usage
df -h

# Pull latest code and redeploy
cd /var/www/metrocardz
git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt && alembic upgrade head
cd ../app && npm install && npm run build && sudo cp -r out/. /var/www/metrocardz/frontend/
sudo systemctl restart metrocardz-api metrocardz-worker metrocardz-beat
```

---

## Troubleshooting

| Problem | Command to diagnose |
|---|---|
| API not responding | `sudo systemctl status metrocardz-api` |
| 502 Bad Gateway | `curl http://127.0.0.1:8000/health` — is Gunicorn up? |
| Site shows old content | `sudo systemctl reload nginx` |
| SSL error | `sudo certbot renew` |
| Can't connect to DB | Check `DATABASE_URL` in `/var/www/metrocardz/backend/.env` |
| Redis error | `redis-cli ping` — should return PONG |
| Service won't start | `journalctl -u metrocardz-api -n 50` — shows full error |
| PostgreSQL won't connect | `sudo systemctl status postgresql` |

---

## BONUS STEP — Automated Nightly Database Backups

> Since PostgreSQL is running locally, you own the backups. This takes 5 minutes to set up and runs every night automatically forever. Free, uses your 200 GB disk.

### Create the backup folder

```bash
sudo mkdir -p /var/backups/metrocardz
sudo chown deploy:deploy /var/backups/metrocardz
```

### Test a manual backup first

```bash
PGPASSWORD=YOUR_DB_PASSWORD pg_dump -U metrocardz_user -h localhost metrocardz > /var/backups/metrocardz/manual_test.sql
```

Replace `YOUR_DB_PASSWORD` with your actual DB password. Then verify it worked:

```bash
ls -lh /var/backups/metrocardz/
# Shows: manual_test.sql (a few KB — that's correct for a fresh DB)
```

### Schedule nightly automatic backups

```bash
crontab -e
```

If asked which editor — type `1` and press Enter (nano).

Add these **2 lines** at the bottom of the file:

```
# Backup DB every night at 2:00 AM
0 2 * * * PGPASSWORD=YOUR_DB_PASSWORD pg_dump -U metrocardz_user -h localhost metrocardz > /var/backups/metrocardz/backup_$(date +\%Y\%m\%d).sql

# Delete backups older than 14 days (keeps disk usage low)
0 3 * * * find /var/backups/metrocardz/ -name "*.sql" -mtime +14 -delete
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Confirm it is scheduled
crontab -l
# Should show both lines
```

✅ Done. Backups run every night at 2 AM. 14 days of history. Uses ~50–200 MB of your 200 GB disk.

---

### To restore from a backup

```bash
# List available backups
ls -lh /var/backups/metrocardz/

# Restore from a specific date (e.g. July 12)
PGPASSWORD=YOUR_DB_PASSWORD psql -U metrocardz_user -h localhost metrocardz < /var/backups/metrocardz/backup_20260712.sql
```

