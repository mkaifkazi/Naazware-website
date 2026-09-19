# 0002 — Auth.js (next-auth v5) Credentials provider

Status: Accepted (2026-09-19)

## Decision
Single-admin auth via Auth.js Credentials + MongoDB adapter; passwords hashed with argon2.

## Why
Session cookies + CSRF built in, cheap, battle-tested, extensible to roles later
without rewrite. Schema keeps a `role` field from day one.

## Alternatives rejected
- Hand-rolled JWT: owns every edge case.
- Clerk/Auth0: monthly cost, overkill for one admin.
