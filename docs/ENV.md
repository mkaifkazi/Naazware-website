# Environment variables (names + purpose only — NEVER commit values)

## Active
- NEXT_PUBLIC_SITE_URL — canonical site origin.
- MONGODB_URI — MongoDB Atlas connection string (server only).
- RESEND_API_KEY — Resend email API key (server only).
- CONTACT_NOTIFICATION_TO — inbox for contact notifications.
- RESEND_FROM — verified Resend sender.
- DNS_SERVERS — OPTIONAL, local-only. Comma-separated DNS servers (e.g. `8.8.8.8,1.1.1.1`)
  used only if the machine's default resolver can't answer the mongodb+srv SRV lookup.
  Leave unset in production (Render).

## Auth (P3)
- AUTH_SECRET — REQUIRED. Signs Auth.js JWT sessions. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- ADMIN_EMAIL — bootstrap only. Email for the first admin (used by `npm run create-admin`).
- ADMIN_PASSWORD — bootstrap only. Password for the first admin; can be blanked/removed after the account exists.

## R2 (P2) — active
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.

## Removed after P9
- NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_WRITE_TOKEN.
