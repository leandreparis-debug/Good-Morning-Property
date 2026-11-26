# `src/server/` — server-only code

Everything that touches the database, sessions or business rules lives here.
Pages and components **never** access the database directly: they call functions
(or Server Actions) exported from this folder.

Layout:

```
server/
  supabase/      client factories (server, browser, admin) + generated database types
  repositories/  typed reads per table (RLS-bound server client)
  auth/          personal links (token, /l/<token> sign-in), session helpers, roles
  team/          Team screen: members, roles, links (Zod schemas + service)
  errors.ts      Postgres errors → DomainError (French messages)
  runAction.ts   Server Action wrapper: { ok, data } | { ok: false, error }
```

The app sends **no email** (decision of 2026-11-26): no mail module.

Rules:

- Every module starts with `import "server-only";` (except `supabase/browser.ts`, the browser
  client, and the generated `supabase/database.types.ts`).
- Every input is validated with Zod before use.
- Business rules (5 topics max, entry window, visibility) are enforced here **and** in the
  database (constraints, RLS), never only in the UI.
