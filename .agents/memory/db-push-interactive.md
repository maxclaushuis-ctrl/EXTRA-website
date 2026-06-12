---
name: db:push is interactive and ignores piped stdin
description: How to apply additive schema changes when drizzle-kit push blocks on a TTY prompt
---

`npm run db:push` (drizzle-kit) shows interactive prompts (e.g. "truncate table?" for new unique constraints on pre-existing tables). It requires a real TTY — piping newlines/`printf '\n'` does NOT answer the prompt; it just re-displays it and the command hangs.

**For purely additive, non-destructive schema changes** (e.g. adding a nullable column), skip the interactive push and apply the DDL directly:
`ALTER TABLE <t> ADD COLUMN IF NOT EXISTS <col> <type>;` via the executeSql callback. Still add the column to `shared/schema.ts` so Drizzle types/queries stay in sync.

**Why:** the test DB had unrelated pending constraints that made `db:push` prompt and block; the column I needed was just nullable text, safe to ALTER directly.

**How to apply:** only ALTER directly for genuinely additive/safe changes. For renames, type changes, or constraints, the interactive push (run in a real terminal) is the safer path.
