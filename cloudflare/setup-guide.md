# Cloudflare Setup Guide — Metro Cardz
## Step-by-step configuration for metrocardz.in

---

## Step 1 — Add Domain to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**
2. Enter `metrocardz.in` → Select **Free Plan**
3. Cloudflare will scan your existing DNS records automatically
4. You'll be given **two Cloudflare nameservers** (e.g. `aria.ns.cloudflare.com`)
5. Go to **Hostinger → Domains → metrocardz.in → DNS/Nameservers**
6. Replace Hostinger's nameservers with the two Cloudflare ones
7. Wait **up to 48 hours** for global DNS propagation

---

## Step 2 — DNS Records in Cloudflare

Set these records in **Cloudflare → DNS → Records**:

| Type  | Name | Value | Proxy |
|-------|------|-------|-------|
| A     | `@`  | *(Hostinger server IP — find in hPanel → Hosting → Details)* | ☁️ Proxied (orange cloud) |
| A     | `www` | *(same Hostinger IP)* | ☁️ Proxied |
| CNAME | `api` | `your-app.onrender.com` *(Render.com URL for backend)* | ☁️ Proxied |

> ⚠️ **Find Hostinger IP:** hPanel → Hosting → (your plan) → Details → "IP Address"
> ⚠️ **Find Render URL:** Render.com → your metrocardz-api service → Settings → "Onrender.com URL"

---

## Step 3 — SSL/TLS Configuration

In **Cloudflare → SSL/TLS → Overview**:
- Set mode to **Full (strict)** ← Important: requires Hostinger's SSL to be active first

In **Cloudflare → SSL/TLS → Edge Certificates**:
- **Always Use HTTPS** → ON ✅
- **HSTS** → Enable, set to **6 months**, include subdomains ✅
- **Minimum TLS Version** → TLS 1.2 ✅
- **Opportunistic Encryption** → ON ✅

---

## Step 4 — Performance / Speed

In **Cloudflare → Speed → Optimization**:
- **Auto Minify** → JS ✅, CSS ✅, HTML ✅
- **Brotli** → ON ✅
- **HTTP/2** → ON (default) ✅

---

## Step 5 — Cache Rules

In **Cloudflare → Caching → Cache Rules**, create two rules:

**Rule 1 — Cache static assets forever (Next.js adds content hashes)**
```
If: URI Path starts with /_next/static/
Then: Cache Level = Cache Everything
      Edge Cache TTL = 1 month
      Browser Cache TTL = 1 year
```

**Rule 2 — Never cache HTML (so new deploys take effect immediately)**
```
If: URI Path equals / OR URI Extension equals html
Then: Cache Level = Bypass
```

---

## Step 6 — Security / WAF (Free Tier)

In **Cloudflare → Security → Settings**:
- **Security Level** → Medium
- **Bot Fight Mode** → ON ✅
- **Browser Integrity Check** → ON ✅

In **Cloudflare → Security → WAF** (free tier has basic rules):
- Enable **Managed Ruleset** if available on your plan

---

## Step 7 — API Token for CI/CD Cache Purge

To allow GitHub Actions to automatically purge cache after each deploy:

1. **Cloudflare → Profile → API Tokens → Create Token**
2. Use template: **"Edit zone DNS"** → customize
3. Set permissions: **Zone → Cache Purge → Purge**
4. Set Zone Resources: **Include → Specific zone → metrocardz.in**
5. Copy the token → add as GitHub Secret: `CLOUDFLARE_API_TOKEN`
6. Get your Zone ID from **Cloudflare → metrocardz.in → Overview → right sidebar → Zone ID**
7. Add Zone ID as GitHub Secret: `CLOUDFLARE_ZONE_ID`

---

## Verification Checklist

- [ ] Site loads at `https://metrocardz.in` (padlock in browser)
- [ ] `http://metrocardz.in` redirects to `https://` (301)
- [ ] `www.metrocardz.in` redirects to `metrocardz.in`
- [ ] `https://api.metrocardz.in/health` returns `{"status":"ok"}`
- [ ] Cloudflare shows "Active" status for the domain
- [ ] After a deploy, content updates within 30 seconds (cache purge working)
- [ ] SSL Labs score: [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/) → A or A+
