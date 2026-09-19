# 0003 — Tiptap for the journal editor

Status: Accepted (2026-09-19)

## Decision
Use Tiptap (headless) for the journal; store content as Tiptap JSON in Mongo.

## Why
Cleanest "modern writing app" UX; JSON renders to React/HTML on the public side.

## Alternatives rejected
- Lexical: more powerful but heavier integration.
- Raw markdown/textarea: fails the writing-experience bar.
