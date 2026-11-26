# Progress

One line block per phase (what is done, PR, points of attention).

## A · Step 2 merged

Database, RLS, seed, pgTAP and Supabase clients merged into `main` —
[PR #3](https://github.com/leandreparis-debug/Good-Morning-Property/pull/3).

## B · Personal links and Team screen

No email anywhere: personal links `/l/<token>` (SHA-256 stored, admin-only columns), middleware,
session helpers, `/equipe` (add, edit, roles, links, deactivation), `set_lead`, bootstrap script.
Attention: e2e now needs the local Supabase stack (CI `e2e` job); in-memory rate limit per instance.
