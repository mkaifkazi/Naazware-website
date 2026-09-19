# 0004 — Cloudflare R2 for media

Status: Accepted (2026-09-19)

## Decision
Store all uploaded media in Cloudflare R2 (S3 API). Mongo stores metadata + object key/URL only.

## Why
Cheap egress, S3-compatible, keeps binaries out of Mongo. Signed upload URLs let
large files skip the app server.

## Alternatives rejected
- Images in Mongo: bloats the DB, bad practice.
- Cloudinary/UploadThing: extra cost/vendor; R2 already chosen by user.
