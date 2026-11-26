# `src/server/` — server-only code

Everything that touches the database, sends mail or holds business rules lives here.
Pages and components **never** access the database directly: they call functions
(or Server Actions) exported from this folder.

Planned layout (filled from step 2 on):

```
server/
  db/        Supabase clients (server, service role) and typed queries
  auth/      session, current member, role checks (responsable, animateur)
  topics/    topics: max 5 per member, priority 1–5, tag, entry window
  visits/    visits and trips of the coming week
  meeting/   wheel draw, speaking turns (nothing persisted after the meeting)
  mail/      MailService interface + Gmail SMTP implementation (step 3)
```

Rules:

- Every module starts with `import "server-only";` once the package is added (step 2).
- Every input is validated with Zod before use.
- Business rules (5 topics max, entry window, visibility) are enforced here **and** in the
  database (constraints, RLS), never only in the UI.
