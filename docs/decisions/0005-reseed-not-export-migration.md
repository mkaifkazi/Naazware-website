# 0005 — Reseed instead of exporting Sanity content

Status: Accepted (2026-09-19)

## Decision
The Sanity content is illustrative/seeded, so reseed fresh into MongoDB from the
local data files rather than building a fragile Sanity export/import.

## Why
No real production content to preserve; local data files are the true source.
