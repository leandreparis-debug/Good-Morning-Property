# `src/server/` — server-only code

Everything that touches the database, sends mail or holds business rules lives here.
Pages and components **never** access the database directly: they call functions
(or Server Actions) exported from this folder.

Layout:

```
server/
  supabase/      client factories (server, browser, admin) + generated database types
  repositories/  typed reads per table (RLS-bound server client)
  errors.ts      Postgres errors → DomainError (French messages)
  auth/      session, current member, role checks (responsable, animateur)
  topics/    topics: max 5 per member, priority 1–5, tag, entry window
  visits/    visits and trips of the coming week
  meeting/   wheel draw, speaking turns (nothing persisted after the meeting)
  mail/      MailService interface + Gmail SMTP implementation (step 3)
```

Rules:

- Every module starts with `import "server-only";` (except `supabase/browser.ts`, the browser
  client, and the generated `supabase/database.types.ts`).
- Every input is validated with Zod before use.
- Business rules (5 topics max, entry window, visibility) are enforced here **and** in the
  database (constraints, RLS), never only in the UI.
