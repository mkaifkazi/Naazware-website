# Phase 10 — Render Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) for the repo-prep tasks. Steps use checkbox (`- [ ]`) syntax. Tasks 3–5 are a human runbook (Render dashboard + credential rotation) — the agent prepares, the operator executes.

**Goal:** Deploy the Mongo-backed Next.js site to Render as a Node web service, driven by a committed `render.yaml` blueprint, with all secrets set in Render and shared credentials rotated before go-live.

**Architecture:** Render "Blueprint" (`render.yaml`) defines a single Node web service: `npm ci && npm run build` then `npm start` (`next start`, honours Render's `$PORT`). Auth.js v5 already has `trustHost: true` + JWT sessions, so no `AUTH_URL` is needed — only `AUTH_SECRET`. MongoDB uses the **mongodb+srv** URI in prod (Render's resolver supports SRV; the local direct string is machine-specific). Content, media (R2), auth, and settings are all already Mongo/R2-backed after P1–P9.

**Tech Stack:** Render (Node web service + Blueprint), Next.js 14 (`next start`), MongoDB Atlas (srv), Cloudflare R2, Resend, Auth.js v5.

## Global Constraints

- Repo-prep work (Tasks 1–2) stays on branch `feat/custom-cms`; deploy from `master` after merge (Task 3).
- Prod `MONGODB_URI` MUST be the `mongodb+srv://…` form (NOT the local direct multi-host string). `DNS_SERVERS` is a local-only workaround — do NOT set it on Render.
- Runtime needs: `MONGODB_URI`, `AUTH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_NOTIFICATION_TO`. `ADMIN_EMAIL`/`ADMIN_PASSWORD` are only needed to run the one-off `create-admin` script against prod, not at runtime.
- All shared credentials (Atlas user, R2 keys, Resend key, AUTH_SECRET, admin password) were exposed in chat during development — **rotate every one before go-live** (Task 5).
- Node pinned to 20 via `.node-version` (Next 14.2 needs ≥18.17).
- Gate must stay GREEN after repo-prep: `npm run test` · `npm run type-check` · `npm run lint` · `npm run build`.

## File Structure

- Delete `netlify.toml`, `.netlify/` (if tracked), and the `netlify-cli` devDependency.
- Create `render.yaml` — the Render Blueprint.
- Create `.node-version` — `20`.
- Modify `docs/HANDOVER.md`, `docs/ROADMAP.md`.

---

### Task 1: Remove Netlify artifacts

**Files:**
- Delete: `netlify.toml`, `.netlify/` (only if git-tracked)
- Modify: `package.json` (drop `netlify-cli` devDependency)

- [ ] **Step 1: Delete the Netlify config**

```bash
git rm --quiet netlify.toml
git rm -r --cached --quiet .netlify 2>/dev/null || true   # only if tracked; it is normally gitignored build output
```

Check `.gitignore` already ignores `.netlify` (add the line if missing) so the local build-output folder stays out of git.

- [ ] **Step 2: Drop the netlify-cli devDependency**

In `package.json`, remove the line:

```json
    "netlify-cli": "^26.1.0",
```

- [ ] **Step 3: Prune + verify gate**

Run: `npm install` (updates the lockfile), then `npm run type-check` and `npm run lint`.
Expected: install succeeds, both clean. (Nothing in `app/`, `lib/`, `components/` imports `netlify-cli`; it was only a local CLI.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json netlify.toml .gitignore
git commit -m "chore: remove Netlify config (deploying to Render) (P10)"
```

---

### Task 2: Add the Render blueprint

**Files:**
- Create: `render.yaml`
- Create: `.node-version`

- [ ] **Step 1: Pin the Node version**

Create `.node-version` with a single line:

```
20
```

- [ ] **Step 2: Write the blueprint**

Create `render.yaml`. Non-secret values are inline; every credential is `sync: false` (operator fills them in the dashboard, never committed):

```yaml
services:
  - type: web
    name: naazware-website
    runtime: node
    plan: starter
    region: singapore
    branch: master
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /
    autoDeploy: true
    envVars:
      - key: NODE_VERSION
        value: "20"
      - key: NEXT_PUBLIC_SITE_URL
        sync: false
      - key: MONGODB_URI
        sync: false
      - key: AUTH_SECRET
        sync: false
      - key: R2_ACCOUNT_ID
        sync: false
      - key: R2_ACCESS_KEY_ID
        sync: false
      - key: R2_SECRET_ACCESS_KEY
        sync: false
      - key: R2_BUCKET
        sync: false
      - key: R2_PUBLIC_URL
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: RESEND_FROM
        sync: false
      - key: CONTACT_NOTIFICATION_TO
        sync: false
```

(No `DNS_SERVERS`, no Sanity keys, no `ADMIN_*` — admin bootstrap is a one-off in Task 4. `region`/`plan` are operator preferences; adjust freely.)

- [ ] **Step 3: Final gate + build**

Run: `npm run test` then `npm run type-check` then `npm run lint` then `npm run build`.
Expected: 60 tests pass, type-check + lint clean, build succeeds (prerenders pages from Mongo).

- [ ] **Step 4: Commit**

```bash
git add render.yaml .node-version
git commit -m "feat: Render blueprint + Node version pin (P10)"
```

---

### Task 3: Merge, push, and create the Render service (operator)

> Human runbook. Requires a GitHub remote and a Render account.

- [ ] **Step 1: Merge repo-prep to master and push**

```bash
git checkout master
git merge --no-ff feat/custom-cms    # or fast-forward; both branches have been kept in sync
git push origin master
```

(If `origin` is not set yet: create a GitHub repo, `git remote add origin <url>`, then `git push -u origin master`.)

- [ ] **Step 2: Create the Blueprint service on Render**

In the Render dashboard → **New → Blueprint** → connect the GitHub repo → Render reads `render.yaml` and proposes the `naazware-website` web service. Apply it. The first deploy will fail/stall until the `sync: false` env vars are set — that is expected.

- [ ] **Step 3: Set the environment variables**

On the service → **Environment**, set each key (use the ROTATED values from Task 5, not the dev ones):
- `NEXT_PUBLIC_SITE_URL` = the Render URL (or the custom domain once attached), e.g. `https://naazware-website.onrender.com`
- `MONGODB_URI` = the **mongodb+srv** connection string (Atlas → Connect → Drivers), with the DB name `naazware`
- `AUTH_SECRET` = a freshly generated secret (`openssl rand -base64 32`)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_NOTIFICATION_TO`

Trigger a manual deploy after saving.

---

### Task 4: Provision prod data + smoke test (operator)

- [ ] **Step 1: Allow Render to reach Atlas**

Atlas → **Network Access** → add `0.0.0.0/0` (or Render's outbound IPs if you have a static-egress add-on). Confirm the Atlas DB user in the srv URI exists with readWrite on `naazware`.

- [ ] **Step 2: Create the prod admin account**

The public site needs no admin, but `/admin` does. Create the admin against the **prod** DB, either:
- locally, pointing the one-off script at prod: set `MONGODB_URI` (srv), `ADMIN_EMAIL`, `ADMIN_PASSWORD` in a temp env and run `npm run create-admin`, **or**
- via a Render one-off Job/Shell with the same env.

Use a strong, rotated admin password (not the dev `Naazware@2026`).

- [ ] **Step 2 (note): content** — the public site falls back to local `*-data.ts` when Mongo is empty, so it renders immediately. Real content is added through `/admin` (projects, testimonials, journal) or by running `npm run seed:mongo` against prod if you want the seed set.

- [ ] **Step 3: Smoke test the live site**

- `GET /` and a few public pages (`/work`, `/blog`, `/contact`) → 200, render correctly, footer shows the settings values
- `POST /api/contact` with a real submission → 200, appears in `/admin/inbox`
- `/admin/login` with the prod admin → reaches the dashboard; `/admin` while logged out → redirects to login
- create a project in `/admin/projects`, publish → shows on `/work`
- upload an image in the media picker → R2 round-trip works (image renders from `R2_PUBLIC_URL`)
- confirm the homepage Organization JSON-LD carries the correct email/socials

---

### Task 5: Rotate credentials (operator — do BEFORE go-live)

> All of these were shared in chat during development and must be rotated.

- [ ] Atlas: change the DB user's password (or create a fresh user), update `MONGODB_URI` on Render.
- [ ] Cloudflare R2: roll the access key pair, update `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
- [ ] Resend: revoke the old API key, issue a new one, update `RESEND_API_KEY`.
- [ ] `AUTH_SECRET`: generate a new one (`openssl rand -base64 32`) — invalidates existing dev sessions (fine).
- [ ] Admin password: set a strong prod password when creating the prod admin (Task 4).
- [ ] Verify the old values no longer work; redeploy so Render picks up the rotated secrets.

---

### Task 6: Docs

- [ ] **Step 1: Update docs**

In `docs/ROADMAP.md`: mark `☑ P10 Render deployment` (leave the operator runbook status as pending until the live deploy is confirmed). In `docs/HANDOVER.md`: set current phase to "P10 — repo prep done; live deploy is an operator runbook (Tasks 3–5)"; record the render.yaml + Netlify removal; keep the credential-rotation reminder prominent.

- [ ] **Step 2: Commit**

```bash
git add docs/HANDOVER.md docs/ROADMAP.md docs/superpowers/plans/2026-09-19-phase-10-render-deploy.md
git commit -m "docs: P10 render deploy — blueprint + runbook"
```

---

## Self-Review

- **Spec coverage:** Roadmap P10 = "Render deployment." Covered: Netlify removal (Task 1), committed Blueprint + Node pin (Task 2), merge/push/create-service runbook (Task 3), prod data + smoke test (Task 4), credential rotation (Task 5), docs (Task 6). Agent executes Tasks 1–2 + 6; operator executes 3–5.
- **Placeholder scan:** none — `render.yaml` and `.node-version` are complete; secret values are intentionally operator-set (`sync: false`), which is correct, not a placeholder.
- **Consistency:** the env-var set in `render.yaml` matches the runtime needs enumerated in Global Constraints and the wired code (`lib/db.ts`, `lib/storage.ts`, `auth.ts`, contact route, `settings-service`). `AUTH_URL` intentionally omitted (`trustHost: true`). `DNS_SERVERS`/Sanity/`ADMIN_*` intentionally excluded from runtime.
- **Design decisions:** Blueprint over manual dashboard (reproducible); deploy from `master`; secrets never committed (`sync: false`); prod uses mongodb+srv; local fallback data means the site renders before any content is entered.
- **Risk note:** first deploy fails until env vars are set (expected, called out). Render Starter instances cold-start/spin down on idle — the first request after idle is slow; not a correctness issue. If Atlas network access is not opened to Render, DB reads fail at runtime and pages fall back to local `*-data.ts` (site still renders, but `/admin` and contact persistence break) — Task 4 Step 1 prevents this.
