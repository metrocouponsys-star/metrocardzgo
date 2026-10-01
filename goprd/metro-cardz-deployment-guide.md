# Metro Cardz — Deployment & Setup Guide (Hostinger)

## 1. Prerequisites
- Hostinger Web App Hosting plan (already provisioned)
- Domain `metrocardz.in` (already owned)
- GitHub account for repo hosting
- Node.js 18/20/22/24 locally for development (match whichever you set on Hostinger)

---

## 2. Local Project Setup

```bash
npx create-next-app@latest metro-cardz --typescript --tailwind --app
cd metro-cardz
npm install prisma @prisma/client bcrypt next-auth
npx prisma init
```

Copy the schema from `metro-cardz-schema.prisma` into `prisma/schema.prisma`, then:

```bash
npx prisma generate
```

---

## 3. Database Setup on Hostinger

1. In hPanel → Databases → create a new MySQL database and user
2. Note the connection details: host, database name, username, password
3. Set `DATABASE_URL` locally in `.env`:
   ```
   DATABASE_URL="mysql://username:password@host:3306/databasename"
   ```
4. Run initial migration:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed initial categories and cities (write a `prisma/seed.ts` with the 8 categories and 9 cities listed in the PRD)

---

## 4. GitHub → Hostinger Deployment

1. Push the project to a new GitHub repository
2. In hPanel → Websites → Web App → connect GitHub repo
3. Set the branch to deploy from (`main`)
4. Set build command: `npm run build`
5. Set start command: `npm run start`
6. Add environment variables in Hostinger's app settings panel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL=https://metrocardz.in`
7. Trigger first deploy — Hostinger auto-builds and starts the app
8. Point the `metrocardz.in` domain to this Web App in hPanel's domain settings
9. Confirm SSL is issued automatically (Hostinger manages this on supported plans)

---

## 5. Post-Deploy Checklist

- [ ] Run `npx prisma migrate deploy` against production DB (via Hostinger's deploy hook or terminal access if available on your plan)
- [ ] Seed categories/cities in production DB
- [ ] Create the first `admin_users` record (hash the password with bcrypt — do not insert plaintext)
- [ ] Test `/go` loads and category tiles render
- [ ] Test admin login at `/admin/login`
- [ ] Create one test deal end-to-end (admin → public page → redirect)
- [ ] Encode the NFC card with `https://metrocardz.in/go` and test a physical tap
- [ ] Verify SSL padlock shows on the live domain

---

## 6. Ongoing Deploy Flow (post-launch)

Every future code change: push to `main` → Hostinger auto-deploys. No manual redeploy needed for content changes (new deals, brand edits) — those go through the admin panel and hit the database directly, not the codebase.

---

## 7. Rollback Plan

- Keep at least the last 2 known-good commits taggable in GitHub (`git tag v1.0`, etc.)
- If a deploy breaks the app, redeploy the previous commit from Hostinger's deployment history (if supported on your plan) or manually revert and push
- Database changes (migrations) should be additive where possible — avoid destructive migrations in early phases so a code rollback doesn't orphan data
