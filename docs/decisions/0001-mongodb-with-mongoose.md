# 0001 — MongoDB (Atlas) via Mongoose

Status: Accepted (2026-09-19)

## Decision
Use MongoDB Atlas as the datastore, accessed through Mongoose 8.

## Why
Data is simple documents (projects, posts, testimonials, enquiries) with no
complex relational needs. Mongoose gives schema, validation, hooks, and TS
types in one place — matching the "clean model structure" goal.

## Alternatives rejected
- Native driver: hand-rolled validation/types = more code, same result.
- Prisma (Mongo): weak Mongo support (no true transactions/relations); fights the document grain.
