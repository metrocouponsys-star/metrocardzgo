# backend/ — NOT USED ON HOSTINGER

> ⚠️ **This folder is NOT deployed to Hostinger.**

## Why this folder exists

The `backend/` folder is a Python/FastAPI implementation that was originally written for a VPS-based deployment. **Your Hostinger Web App Hosting plan supports Node.js only** — Python cannot run there.

## What runs instead

The **Next.js app** (`../app/`) is 100% self-contained:

| Feature | Where it lives |
|---|---|
| Auth (login, OTP) | `app/src/app/api/v1/auth/` |
| Members & Loyalty | `app/src/app/api/v1/members/` |
| Offers & Campaigns | `app/src/app/api/v1/offers/`, `/campaigns/` |
| Redemptions | `app/src/app/api/v1/redemptions/` |
| Admin dashboard | `app/src/app/api/v1/admin/` |
| Deals platform | `app/src/app/api/` |
| Cron jobs (no Celery) | `app/src/app/api/v1/cron/` |
| Database | Prisma + Hostinger MySQL |
| File uploads | Hostinger disk (`public_html/uploads/`) |

## To deploy

Only deploy the `app/` folder to Hostinger Web App. This `backend/` folder is ignored completely.

See the deployment guide for step-by-step instructions.
