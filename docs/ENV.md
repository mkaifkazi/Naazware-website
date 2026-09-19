# Environment variables (names + purpose only — NEVER commit values)

## Active
- NEXT_PUBLIC_SITE_URL — canonical site origin.
- MONGODB_URI — MongoDB Atlas connection string (server only).
- RESEND_API_KEY — Resend email API key (server only).
- CONTACT_NOTIFICATION_TO — inbox for contact notifications.
- RESEND_FROM — verified Resend sender.

## Added later
- P2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
- P3: AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (bootstrap only).

## Removed after P9
- NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_WRITE_TOKEN.
