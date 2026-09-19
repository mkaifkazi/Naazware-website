# 0002 — Auth.js (next-auth v5) Credentials provider

Status: Accepted (2026-09-19)

## Decision
Single-admin auth via Auth.js Credentials + MongoDB adapter; passwords hashed with argon2.

## Why
Session cookies + CSRF built in, cheap, battle-tested, extensible to roles later
without rewrite. Schema keeps a `role` field from day one.

## Refinement (P3 implementation)
Session strategy = **JWT**, no Mongo adapter. For a single credentials user the adapter
is unnecessary; the Credentials `authorize` callback verifies against the `Admin` model
with argon2. Config is split for the Edge runtime: `auth.config.ts` (edge-safe, no DB) is
used by `middleware.ts`; `auth.ts` adds the Credentials provider for the Node route.

## Alternatives rejected
- Hand-rolled JWT: owns every edge case.
- Clerk/Auth0: monthly cost, overkill for one admin.
