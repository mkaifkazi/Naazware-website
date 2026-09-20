# Spec 2 P5 — Conversion Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/contact` into the conversion centerpiece — add an optional "I'd prefer a call" path (phone + preferred time) end-to-end through the existing Enquiry pipeline, and reframe services copy outcome-led.

**Architecture:** Extend the existing Enquiry stack (model → zod schema → service → `/api/contact` route → public `ContactForm` → admin inbox) with three new optional fields (`prefersCall`, `phone`, `preferredTime`). All fields optional in the DB → backwards compatible, no migration. A zod `.refine` makes `phone` required only when `prefersCall` is true. Copy changes (contact page + services) are separate, low-risk tasks at the end.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Mongoose, zod, react-hook-form + `@hookform/resolvers/zod`, Vitest + `mongodb-memory-server`, Tailwind (light-first tokens), Resend (email).

## Global Constraints

- **Backwards compatible:** all three new fields optional in Mongo with defaults; existing seeded enquiries must load unaffected; no migration. (Spec 2 §5)
- **Defence in depth:** server zod (`lib/schemas/enquiry.ts`) is the source of truth; client zod in `ContactForm` mirrors it. (existing pattern)
- **Reassurance copy is exactly:** `We reply within 1 business day.` (Spec 2 §5)
- **Light-first default theme**; new form UI uses existing light/dark token classes already in the codebase — do not invent colors. (Spec 2 §3)
- **Never silently lose a lead:** `/api/contact` returns 500 only if BOTH DB write and email fail. (existing route contract)
- **Field shapes (verbatim — used across every task):**
  - `prefersCall`: boolean, DB default `false`
  - `phone`: string, DB default `''`, zod `max(40)`
  - `preferredTime`: string, DB default `''`, zod `max(120)`
- **Gate after each task:** `npm run test` · `npm run type-check` · `npm run lint` all green before commit.

---

### Task 1: Enquiry model + server schema — new fields & conditional validation

**Files:**
- Modify: `lib/models/Enquiry.ts`
- Modify: `lib/schemas/enquiry.ts`
- Create: `lib/schemas/enquiry.test.ts`

**Interfaces:**
- Consumes: nothing (leaf).
- Produces:
  - `enquiryInputSchema` (zod) now also accepts `prefersCall?: boolean`, `phone?: string`, `preferredTime?: string` with a refine: when `prefersCall === true`, `phone` (trimmed) must be non-empty, error `path: ['phone']`, message `Phone is required for a call`.
  - `EnquiryInput` type gains the three fields (all optional in input; `prefersCall` defaults to `false`).
  - `EnquiryDoc` (mongoose inferred) gains `prefersCall: boolean`, `phone: string`, `preferredTime: string`.

- [ ] **Step 1: Write the failing test**

Create `lib/schemas/enquiry.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { enquiryInputSchema } from './enquiry'

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  budget: '10k-25k',
  message: 'Hello there, this is long enough.',
  consent: true as const,
}

describe('enquiryInputSchema — prefer a call', () => {
  it('accepts a plain enquiry with no call fields (defaults prefersCall false)', () => {
    const parsed = enquiryInputSchema.parse(valid)
    expect(parsed.prefersCall).toBe(false)
    expect(parsed.phone ?? '').toBe('')
  })

  it('accepts a call request with a phone number', () => {
    const parsed = enquiryInputSchema.parse({
      ...valid,
      prefersCall: true,
      phone: '+971 50 123 4567',
      preferredTime: 'Weekday mornings',
    })
    expect(parsed.prefersCall).toBe(true)
    expect(parsed.phone).toBe('+971 50 123 4567')
  })

  it('rejects a call request with no phone', () => {
    const res = enquiryInputSchema.safeParse({ ...valid, prefersCall: true, phone: '' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes('phone'))).toBe(true)
    }
  })

  it('rejects a call request with whitespace-only phone', () => {
    const res = enquiryInputSchema.safeParse({ ...valid, prefersCall: true, phone: '   ' })
    expect(res.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/schemas/enquiry.test.ts`
Expected: FAIL — `prefersCall` is `undefined` (not defaulted) / call-without-phone still parses.

- [ ] **Step 3: Extend the server zod schema**

In `lib/schemas/enquiry.ts`, replace the `enquiryInputSchema` definition with:

```typescript
import { z } from 'zod'

// Mirrors the public ContactForm payload (client-side zod) + defence-in-depth.
export const enquiryInputSchema = z
  .object({
    name: z.string().min(2).max(200),
    email: z.string().email().max(320),
    company: z.string().max(200).optional(),
    budget: z.string().min(1).max(120),
    message: z.string().min(10).max(5000),
    consent: z.literal(true),
    website: z.string().max(0).optional(), // honeypot — must be empty
    prefersCall: z.boolean().optional().default(false),
    phone: z.string().max(40).optional().default(''),
    preferredTime: z.string().max(120).optional().default(''),
  })
  .refine((d) => !d.prefersCall || d.phone.trim().length > 0, {
    message: 'Phone is required for a call',
    path: ['phone'],
  })
```

Leave `EnquiryInput`, `enquiryStatusSchema`, and `EnquiryStatus` as they are (`EnquiryInput = z.infer<typeof enquiryInputSchema>` still works through `.refine`).

- [ ] **Step 4: Add the mongoose fields**

In `lib/models/Enquiry.ts`, add the three fields to `enquirySchema` (after `message`, before `status`):

```typescript
    message: { type: String, required: true },
    prefersCall: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    preferredTime: { type: String, default: '' },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- lib/schemas/enquiry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Gate + commit**

```bash
npm run type-check && npm run lint
git add lib/schemas/enquiry.ts lib/schemas/enquiry.test.ts lib/models/Enquiry.ts
git commit -m "feat(contact): Enquiry model+schema gain prefersCall/phone/preferredTime (Spec 2 P5)"
```

---

### Task 2: Persist & surface the new fields in `enquiries-service`

**Files:**
- Modify: `lib/enquiries-service.ts`
- Modify: `lib/enquiries-service.test.ts`

**Interfaces:**
- Consumes: `EnquiryInput` (Task 1) — now carries `prefersCall`/`phone`/`preferredTime`.
- Produces:
  - `createEnquiry` writes the three new fields.
  - `AdminEnquiryRow` type gains `prefersCall: boolean`, `phone: string`, `preferredTime: string`; `listEnquiries` returns them.
  - (`getEnquiryById` already returns the full `EnquiryDoc`, so detail reads work without change.)

- [ ] **Step 1: Write the failing test**

Append to `lib/enquiries-service.test.ts` (inside the existing `describe`):

```typescript
  it('createEnquiry persists call-preference fields', async () => {
    const { id } = await createEnquiry({
      ...base,
      name: 'Call Me',
      email: 'call@example.com',
      message: 'Please ring me about this.',
      prefersCall: true,
      phone: '+971 50 000 0000',
      preferredTime: 'Afternoons',
    })
    const doc = await getEnquiryById(id)
    expect(doc?.prefersCall).toBe(true)
    expect(doc?.phone).toBe('+971 50 000 0000')
    expect(doc?.preferredTime).toBe('Afternoons')
  })

  it('listEnquiries surfaces prefersCall for the table hint', async () => {
    await createEnquiry({
      ...base, name: 'Wants Call', email: 'w@example.com',
      message: 'Ring me on the mobile.', prefersCall: true, phone: '123456',
    })
    const rows = await listEnquiries({ search: 'Wants Call' })
    expect(rows[0].prefersCall).toBe(true)
    expect(rows[0].phone).toBe('123456')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/enquiries-service.test.ts`
Expected: FAIL — `doc.prefersCall` undefined / `rows[0].prefersCall` is not a property on `AdminEnquiryRow` (also a type error).

- [ ] **Step 3: Write `prefersCall`/`phone`/`preferredTime` in `createEnquiry`**

In `lib/enquiries-service.ts`, update the `Enquiry.create({...})` object:

```typescript
  const created = await Enquiry.create({
    name: input.name,
    email: input.email,
    company: input.company ?? '',
    budget: input.budget,
    message: input.message,
    prefersCall: input.prefersCall ?? false,
    phone: input.phone ?? '',
    preferredTime: input.preferredTime ?? '',
    status: 'new',
  })
```

- [ ] **Step 4: Add the fields to `AdminEnquiryRow` and `listEnquiries`**

Extend the `AdminEnquiryRow` type:

```typescript
export type AdminEnquiryRow = {
  id: string
  name: string
  email: string
  company: string
  budget: string
  prefersCall: boolean
  phone: string
  preferredTime: string
  status: EnquiryStatus
  createdAt: Date
}
```

And the `.map` in `listEnquiries`:

```typescript
  return rows.map((e) => ({
    id: String(e._id),
    name: e.name,
    email: e.email,
    company: e.company ?? '',
    budget: e.budget ?? '',
    prefersCall: Boolean(e.prefersCall),
    phone: e.phone ?? '',
    preferredTime: e.preferredTime ?? '',
    status: (e.status ?? 'new') as EnquiryStatus,
    createdAt: e.createdAt,
  }))
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- lib/enquiries-service.test.ts`
Expected: PASS (all existing + 2 new).

- [ ] **Step 6: Gate + commit**

```bash
npm run type-check && npm run lint
git add lib/enquiries-service.ts lib/enquiries-service.test.ts
git commit -m "feat(contact): persist + list prefersCall/phone/preferredTime (Spec 2 P5)"
```

---

### Task 3: `/api/contact` route — accept new fields & include them in the notification email

**Files:**
- Modify: `app/api/contact/route.ts`

**Interfaces:**
- Consumes: `enquiryInputSchema` (Task 1) + `createEnquiry` (Task 2). `parsed.data` already carries the new fields, so persistence needs no route change — only the email body.
- Produces: notification email HTML includes a "Wants a call" line + phone + preferred time when `prefersCall` is true.

> No unit test — this route depends on Resend + env and matches the existing untested route. Verified over HTTP in Task 7's manual checklist.

- [ ] **Step 1: Destructure the new fields**

In `app/api/contact/route.ts`, update the destructure line:

```typescript
    const { name, email, company, budget, message, prefersCall, phone, preferredTime } = parsed.data
```

- [ ] **Step 2: Add the call block to the email HTML**

In the `resend.emails.send({...})` call, insert this immediately after the Budget `<p>` and before the Message `<p>`:

```typescript
            ${
              prefersCall
                ? `<p><strong>Prefers a call:</strong> Yes</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
            <p><strong>Preferred time:</strong> ${escapeHtml(preferredTime || 'Any')}</p>`
                : ''
            }
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat(contact): include call preference in enquiry notification email (Spec 2 P5)"
```

---

### Task 4: Public `ContactForm` — progressive "prefer a call" disclosure + light restyle + reassurance copy

**Files:**
- Modify: `components/ContactForm.tsx`

**Interfaces:**
- Consumes: `/api/contact` (Task 3) — POST body now may include `prefersCall`, `phone`, `preferredTime`.
- Produces: the visible conversion form. Client zod mirrors the server refine; when "I'd prefer a call" is checked, phone + preferred-time fields reveal and phone becomes required.

> Progressive disclosure + styling are visual — verified in Task 7's manual browser checklist. Do the client zod refine + wiring here.

- [ ] **Step 1: Mirror the server refine in the client schema**

In `components/ContactForm.tsx`, replace the `contactSchema` with (note `.refine` on the object):

```typescript
const contactSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    company: z.string().optional(),
    budget: z.string().min(1, 'Please select a budget range'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    consent: z.boolean().refine((val) => val === true, {
      message: 'You must agree to continue',
    }),
    website: z.string().optional(), // honeypot — must stay empty
    prefersCall: z.boolean().optional(),
    phone: z.string().optional(),
    preferredTime: z.string().optional(),
  })
  .refine((d) => !d.prefersCall || (d.phone?.trim().length ?? 0) > 0, {
    message: 'Add a phone number so we can call you',
    path: ['phone'],
  })
```

- [ ] **Step 2: Watch the checkbox to drive disclosure**

Add `watch` to the `useForm` destructure and read the checkbox:

```typescript
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const prefersCall = watch('prefersCall')
```

- [ ] **Step 3: Add the checkbox + revealed fields**

In the JSX, immediately **before** the existing `consent` checkbox block, insert:

```tsx
      <div className="flex items-start gap-3">
        <input
          id="prefersCall"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-ink-600 bg-ink-900 text-accent-soft accent-accent focus:ring-accent/60"
          {...register('prefersCall')}
        />
        <label htmlFor="prefersCall" className="text-sm text-paper-dim">
          I&apos;d prefer a call
        </label>
      </div>

      {prefersCall && (
        <div className="space-y-5 rounded-2xl border border-ink-600 bg-ink-900/40 p-5">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-paper">
              Phone *
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={`${inputBase} ${border(errors.phone)}`}
              {...register('phone')}
            />
            {errors.phone && <p className="mt-1.5 text-sm text-red-400">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="preferredTime" className="mb-2 block text-sm font-medium text-paper">
              Best time to reach you <span className="text-paper-faint">(optional)</span>
            </label>
            <input
              id="preferredTime"
              type="text"
              placeholder="e.g. weekday mornings"
              className={`${inputBase} border-ink-600`}
              {...register('preferredTime')}
            />
          </div>
        </div>
      )}
```

- [ ] **Step 4: Update the reassurance copy under the message field**

Change the helper line under the message textarea from `We&apos;ll reply within 24 hours.` to:

```tsx
        <p className="mt-1.5 text-sm text-paper-faint">We reply within 1 business day.</p>
```

- [ ] **Step 5: Verify it compiles + gate**

Run: `npm run type-check && npm run lint && npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ContactForm.tsx
git commit -m "feat(contact): progressive 'prefer a call' disclosure + client refine + reassurance copy (Spec 2 P5)"
```

---

### Task 5: Admin inbox — show call preference in detail + hint in the table

**Files:**
- Modify: `components/admin/EnquiryDetail.tsx`
- Modify: `app/(admin)/admin/inbox/[id]/page.tsx`
- Modify: `components/admin/EnquiriesTable.tsx`

**Interfaces:**
- Consumes: `getEnquiryById` (returns `EnquiryDoc` with new fields) + `AdminEnquiryRow` (Task 2, now has `prefersCall`/`phone`/`preferredTime`).
- Produces: admin can see who wants a call, their phone, and preferred time.

> Display-only — verified in Task 7's manual checklist.

- [ ] **Step 1: Widen `EnquiryDetail` props + render the call block**

In `components/admin/EnquiryDetail.tsx`, add the three props to the component signature (both the destructure and the type):

```typescript
export default function EnquiryDetail({
  id, name, email, company, budget, message, status, createdAt,
  prefersCall, phone, preferredTime,
}: {
  id: string
  name: string
  email: string
  company: string
  budget: string
  message: string
  status: string
  createdAt: string
  prefersCall: boolean
  phone: string
  preferredTime: string
}) {
```

Then, inside the detail card, insert this immediately after the meta `<div>` that ends with the status line and **before** the `<hr ... />`:

```tsx
        {prefersCall && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <span className="font-medium text-accent-soft">📞 Wants a call</span>
            <div className="mt-2 text-paper-dim">
              {phone && (
                <div>
                  Phone: <a href={`tel:${phone}`} className="text-accent-soft hover:underline">{phone}</a>
                </div>
              )}
              {preferredTime && <div>Preferred time: {preferredTime}</div>}
            </div>
          </div>
        )}
```

- [ ] **Step 2: Pass the new props from the inbox detail page**

In `app/(admin)/admin/inbox/[id]/page.tsx`, extend the `<EnquiryDetail ... />` props:

```tsx
    <EnquiryDetail
      id={params.id}
      name={doc.name}
      email={doc.email}
      company={doc.company ?? ''}
      budget={doc.budget ?? ''}
      message={doc.message}
      prefersCall={Boolean(doc.prefersCall)}
      phone={doc.phone ?? ''}
      preferredTime={doc.preferredTime ?? ''}
      status={status === 'new' ? 'read' : status}
      createdAt={doc.createdAt ? new Date(doc.createdAt).toISOString() : ''}
    />
```

- [ ] **Step 3: Add the `prefersCall` hint to `EnquiriesTable`**

In `components/admin/EnquiriesTable.tsx`, add the fields to `EnquiryRow`:

```typescript
export type EnquiryRow = {
  id: string
  name: string
  email: string
  company: string
  budget: string
  prefersCall: boolean
  phone: string
  preferredTime: string
  status: string
  createdAt: string
}
```

Then, in the "From" cell, append a call chip after the name link's `<div className="text-xs...">` line (inside the same `<td>`):

```tsx
                  {r.prefersCall && (
                    <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-soft">
                      📞 wants a call
                    </span>
                  )}
```

- [ ] **Step 4: Gate**

Run: `npm run type-check && npm run lint && npm run test`
Expected: PASS. (The inbox list server page passes `AdminEnquiryRow[]` straight through; those rows now carry the new fields from Task 2, so no further wiring is needed. If `type-check` flags the list page's `initial` prop, confirm it forwards `listEnquiries()` output unchanged.)

- [ ] **Step 5: Commit**

```bash
git add components/admin/EnquiryDetail.tsx "app/(admin)/admin/inbox/[id]/page.tsx" components/admin/EnquiriesTable.tsx
git commit -m "feat(admin): inbox shows call preference badge + phone + time (Spec 2 P5)"
```

---

### Task 6: Contact page — rewrite intro + expectations as conversion copy (light-first)

**Files:**
- Modify: `app/(site)/contact/page.tsx`

**Interfaces:**
- Consumes: nothing new (copy only). The form already carries the call path from Task 4.
- Produces: contact page reads as the conversion centerpiece; timeline promise consistent with the form (1 business day).

> Copy is Claude-drafted SMB voice — user edits/approves wording. Keep it aligned with `We reply within 1 business day.`

- [ ] **Step 1: Align the reply-time promise + subtitle**

In `app/(site)/contact/page.tsx`:
- Change the page `metadata.description` and the `PageHeader` `subtitle` "within 24 hours" phrasing to "within 1 business day".
- In the `expectations` array, change `'Reply within 24 hours (usually faster)'` to `'Reply within 1 business day (usually faster)'`.
- In the Info column, change the two `We reply within 24 hours.` helper lines to `We reply within 1 business day.`

- [ ] **Step 2: Reword the "Prefer to talk first?" panel to point at the form's call option**

Replace the panel body paragraph so it nudges toward the in-form call option while keeping the phone/email fallback:

```tsx
              <p className="mt-2 text-sm text-paper-dim">
                Tick <span className="text-paper">“I&apos;d prefer a call”</span> in the form and
                we&apos;ll ring you back — or reach us directly at{' '}
                <a href={`mailto:${settings.email}`} className="text-accent-soft hover:text-accent-soft">
                  {settings.email}
                </a>{' '}
                /{' '}
                <a href={settings.phoneHref} className="text-accent-soft hover:text-accent-soft">
                  {settings.phone}
                </a>. We work with clients worldwide across all time zones.
              </p>
```

- [ ] **Step 3: Update the FAQ timeline answer for consistency (optional copy)**

If the first FAQ or any answer says "24 hours", align it to "1 business day". (Leave project-duration weeks as-is.)

- [ ] **Step 4: Gate**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS (build confirms the page compiles).

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/contact/page.tsx"
git commit -m "feat(contact): rewrite contact page as conversion centerpiece, 1-business-day promise (Spec 2 P5)"
```

---

### Task 7: Services reframe (outcome-led) + full P5 verification

**Files:**
- Modify: `lib/services-data.ts`
- Modify: `lib/home-content.ts` (only if wording needs alignment)

**Interfaces:**
- Consumes: nothing new. `ServiceCard` already renders `title` + `shortDescription` + `bullets`; the services page + `[slug]` page render `challenge`/`approach`/`result`.
- Produces: services copy leads with the customer outcome, not the tech.

> Copy is Claude-drafted — user edits/approves. Reframe each service's `shortDescription` + `bullets` to lead with the business result (more enquiries, faster launch, less hassle), keeping `technologies`/`keywords` for SEO. Do NOT fabricate metrics — keep claims general unless already backed by a real project.

- [ ] **Step 1: Reframe each service's `shortDescription` + `bullets` outcome-first**

For every entry in `lib/services-data.ts`, rewrite `shortDescription` to open with the outcome for the business owner and `bullets` to be benefit-led (e.g. "More enquiries from a site that loads instantly" rather than "Performance-first architecture"). Keep it plain-English SMB voice consistent with `lib/home-content.ts`. Leave `technologies` and `keywords` unchanged. Example for `web-development`:

```typescript
    shortDescription:
      'A fast, modern website that turns visitors into enquiries — built to make your business look established and easy to do business with.',
    bullets: [
      'More enquiries from a site that loads instantly',
      'Looks great on every phone and screen',
      'Easy for you to update — no developer needed',
    ],
```

Apply the same treatment to the remaining services.

- [ ] **Step 2: Align the home services section heading if needed**

`lib/home-content.ts` `sections.services.heading` is already outcome-led ("Everything you need to grow online, under one roof."). Adjust only if wording now clashes with the reframed cards. No forced change.

- [ ] **Step 3: Gate**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/services-data.ts lib/home-content.ts
git commit -m "feat(services): reframe service copy outcome-led (Spec 2 P5)"
```

- [ ] **Step 5: Full P5 manual verification (real browser + live HTTP)**

Dev gotcha: do NOT `npm run build` while `npm run dev` is live. After the Task 6/7 builds, if dev is running: kill dev, `rm -rf .next`, restart `npm run dev`.

Run `npm run dev` and verify, in **light default AND dark toggle**:

1. `/contact` — form renders; ticking **"I'd prefer a call"** reveals Phone + preferred-time; submitting with the box ticked but phone empty shows the client error; a plain submit (box unticked) still succeeds.
2. Submit a call request → 200; check the notification email (or server log) includes the call/phone/time lines.
3. Admin `/admin/inbox` — the new enquiry shows the "wants a call" chip; open it → detail shows the call badge, clickable phone, preferred time.
4. Submit a plain enquiry (no call) → inbox shows no chip, detail shows no call block (backwards-compatible path).
5. `/services` + a `/services/[slug]` page — copy reads outcome-led; cards render on the home page.
6. Reduced-motion / mobile — contact form still fully usable (fields not hidden by motion gates).

- [ ] **Step 6: Final gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all GREEN.

---

## Self-Review notes

- **Spec §5 coverage:** model (T1) · schema+refine (T1) · route+email (T3) · client form progressive disclosure+mirror (T4) · admin detail badge+phone+time (T5) · table hint (T5) · reassurance copy exact string (T4/T6) · backwards-compatible optional fields (T1 defaults, verified T7 step 4). ✔
- **Services reframe** (handover P5 second half): T7. ✔
- **Contact rewrite** (Spec §2 "conversion centerpiece"): T6. ✔
- **Type consistency:** field names `prefersCall`/`phone`/`preferredTime` identical across schema, model, service, route, form, detail, table, page. `AdminEnquiryRow` (service) and `EnquiryRow` (table) both carry all three. ✔
- **Out of scope (not this plan):** P10 deploy runbook; broader light-restyle of admin components (tokens already inherited).
