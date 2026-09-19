# Naazware CMS — Plan 4b: Projects Admin UI (Phase 4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Give the admin a usable, brand-consistent UI to manage projects — a list with search/filter/status/featured, row actions (edit, duplicate, delete), and a full editor form that creates/updates projects and attaches media through a picker + direct-to-R2 upload.

**Architecture:** Client components under `app/(admin)/admin/projects` call the P4a JSON APIs via a tiny fetch helper (`lib/admin-client.ts`). A reusable `MediaPicker` (browse existing media) and `UploadButton` (sign → PUT to R2 → register) live in `components/admin`. No new server logic — this consumes P4a routes. Hand-rolled Tailwind using existing brand tokens (ink/paper/accent), dark theme, glass surfaces — matching the P3 admin shell.

**Tech Stack:** Next.js client components, React, Tailwind, the P4a APIs.

## Global Constraints

- TS strict, `@/*` alias. Dark admin theme, brand tokens only.
- All data ops go through P4a APIs (already auth-gated/validated). UI does optimistic-light, confirms destructive actions.
- Keep components focused: list, editor form, media picker, upload button, small field primitives.
- Reduced-motion friendly; accessible labels on inputs.

## Files

- `lib/admin-client.ts` — `apiGet/apiSend` fetch helpers (throw on non-2xx, parse JSON).
- `components/admin/ui.tsx` — small primitives: `Field`, `TextInput`, `TextArea`, `Toggle`, `TagInput`, `Button`, `Select`.
- `components/admin/UploadButton.tsx` — sign+PUT+register, returns `{id,url,key}`.
- `components/admin/MediaPicker.tsx` — modal grid of existing media + upload; onSelect returns a media id+url.
- `components/admin/ImageField.tsx` — shows current cover thumbnail; opens MediaPicker; clears.
- `app/(admin)/admin/projects/page.tsx` — list (server component: initial fetch via service) + client table island for search/filter/actions.
- `components/admin/ProjectsTable.tsx` — client: search box, status/featured filters, rows with edit/duplicate/delete.
- `app/(admin)/admin/projects/new/page.tsx` — editor (create).
- `app/(admin)/admin/projects/[id]/page.tsx` — editor (edit; loads project).
- `components/admin/ProjectEditor.tsx` — the shared form (all fields), submit → POST/PUT.

## Tasks

### Task 1: Client fetch helper + UI primitives
- [ ] `lib/admin-client.ts`: `apiGet<T>(url)`, `apiSend<T>(url, method, body)` — `credentials:'same-origin'`, JSON, throw `Error(data.error)` on !ok.
- [ ] `components/admin/ui.tsx`: `Button` (variants primary/ghost/danger), `TextInput`, `TextArea`, `Select`, `Toggle`, `TagInput` (comma/enter to add chips), `Field` (label+children+hint). All styled with brand tokens.
- [ ] Typecheck. Commit: `feat: admin client helper + form UI primitives`.

### Task 2: Upload + MediaPicker + ImageField
- [ ] `UploadButton`: input[type=file] → POST /api/admin/media/sign → `fetch(uploadUrl,{method:'PUT',body:file,headers:{'content-type':file.type}})` → POST /api/admin/media (register with size/type/filename; read image width/height via createImageBitmap when image) → onUploaded({id,url,key}). Shows progress/disabled state; validates type client-side (mirror server allowlist) + 50MB cap.
- [ ] `MediaPicker` (modal): GET /api/admin/media (+search); grid of thumbnails; an UploadButton; click selects; delete with confirm (DELETE /api/admin/media/[id]).
- [ ] `ImageField`: props { label, value:{id,url}|null, onChange }. Thumbnail + "Choose"/"Remove"; opens MediaPicker.
- [ ] Typecheck + build. Commit: `feat: media upload button + picker + image field`.

### Task 3: Projects list
- [ ] `app/(admin)/admin/projects/page.tsx` (server): `listProjects()` for initial rows; render header "Projects" + "New project" link + `<ProjectsTable initial={rows} />`.
- [ ] `components/admin/ProjectsTable.tsx` (client): search input (debounced → GET /api/admin/projects?search=), status filter (all/draft/published), featured filter; table rows: title, client, status badge, featured dot, updated; actions: Edit (link), Duplicate (POST → refresh), Delete (confirm → DELETE → refresh). Empty state.
- [ ] Typecheck + build. Commit: `feat: admin projects list (search/filter/duplicate/delete)`.

### Task 4: Project editor
- [ ] `components/admin/ProjectEditor.tsx` (client): controlled form for all fields — title, slug (auto from title if blank), client, industry, shortDescription, fullDescription, challenge, solution, outcome, services (TagInput), technologies (TagInput), metrics (repeatable label/value rows), coverMedia (ImageField), gallery (multi ImageField/list), videoUrl, externalUrl, testimonial (quote/author/role), featured (Toggle), status (Select draft/published), seo (title/description/ogImage via ImageField). Submit → create (POST) or update (PUT); success → redirect to list; inline error surface from API `issues`.
- [ ] `app/(admin)/admin/projects/new/page.tsx`: `<ProjectEditor mode="create" />`.
- [ ] `app/(admin)/admin/projects/[id]/page.tsx` (server): fetch project via `getProjectById`; map to editor initial values (cover/gallery resolved to {id,url} via Media lookup); render `<ProjectEditor mode="edit" id=... initial=... />`; 404 if missing.
- [ ] Typecheck + build. Commit: `feat: admin project editor (create/edit, all fields, media)`.

### Task 5: Verify + docs
- [ ] Full gate: `npm run test && npm run type-check && npm run lint && npm run build`.
- [ ] Live smoke (dev + login): create a project with a cover upload → appears in list → appears on public /work after publish; edit; duplicate; delete. Record result.
- [ ] Update ROADMAP (P4 ☑) + HANDOVER (next = P5 testimonials). Commit.

## Acceptance
Admin can fully manage projects from the browser: list/search/filter, create/edit with media uploaded to R2, duplicate, reorder-ready (order field via API; drag UI optional/deferred), delete. Public site reflects published changes (P1 content layer already reads Mongo).

## Notes / deferrals
- Drag-and-drop reorder UI deferred (reorder API exists; can add dnd later). List uses order then updatedAt.
- Gallery UI: simple add/remove list of images (not sortable) for now.
