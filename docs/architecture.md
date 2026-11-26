# Architecture

## Stack

- **Next.js 15** (App Router, Server Components by default, Server Actions), **React 19**
- **TypeScript** `strict` + `noUncheckedIndexedAccess`
- **Tailwind CSS v4**, CSS-first: tokens declared with `@theme` in `src/styles/tokens.css`
- **Zod** for environment variables and every input
- **Supabase** (Postgres, magic-link Auth, RLS) — local stack via the CLI, see `docs/local-dev.md`
  and `docs/data-model.md`; **Gmail SMTP** for mail from step 3
- Hosted on **Vercel**

## Folders

```
src/
  app/                 routes (French, kebab-case: /mes-sujets, /reunion…)
  components/ui/       design-system building blocks (Button, Card, TopicTag…)
  components/layout/   app shell: header, navigation, background, credit
  lib/                 pure utilities, no I/O (env, cn, dates, topicTags, routes)
  server/              database, mail, business logic — server only
    supabase/          client factories (server, browser, admin) + generated types
    repositories/      typed reads per table, through the RLS-bound server client
    errors.ts          Postgres errors → business errors (French messages)
  styles/              tokens.css (design tokens)
supabase/              config.toml, migrations/, seed.sql, tests/database/ (pgTAP)
tests/e2e/             Playwright tests (+ axe)
scripts/               one-off scripts (background optimisation)
docs/                  design.md, architecture.md
```

Unit tests sit next to the file they test (`*.test.ts(x)`).

## Dependency rules

```
app  ──►  components/layout  ──►  components/ui  ──►  lib
 │                                                    ▲
 └──────────►  server  ───────────────────────────────┘
```

- `lib/` imports nothing from the app (no React components, no I/O). Exception:
  `topicTags.ts` references lucide icons, so the tag mapping stays in one place.
- `components/ui/` imports only `lib/`. No data fetching, no business rules.
- `components/layout/` composes `ui/` and `lib/`.
- `app/` (pages, layouts, Server Actions) is the only caller of `server/`.
- `server/` never imports from `components/` or `app/`.
- Client components (`"use client"`) never import `server/`, with one exception:
  `server/supabase/browser.ts` (public variables only, no `server-only`).
- Every other module in `server/` starts with `import "server-only";`.

## Supabase clients

| Factory                                                      | Key                         | RLS          | Where                                             |
| ------------------------------------------------------------ | --------------------------- | ------------ | ------------------------------------------------- |
| `createSupabaseServerClient()` (`server/supabase/server.ts`) | anon + user session cookies | yes          | Server Components, Server Actions, Route Handlers |
| `getSupabaseBrowserClient()` (`server/supabase/browser.ts`)  | anon + session cookies      | yes          | Client Components (only if really needed)         |
| `createSupabaseAdminClient()` (`server/supabase/admin.ts`)   | `service_role`              | **bypassed** | server tasks no user may do; `server-only`        |

Repositories (`server/repositories/`) use the server client, so the RLS always applies, and
translate errors with `toDomainError()`.

## Environment

`src/lib/env.ts` validates variables with Zod. `next.config.ts` calls it, so `pnpm dev`,
`pnpm build` and `pnpm start` stop at once with a message naming each missing or invalid
variable; `src/instrumentation.ts` checks again when the server process starts (Vercel runtime). Add each new variable to the schema **and** to `.env.example`.

## Security

- HTTP headers in `next.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, minimal `Permissions-Policy`; `poweredByHeader: false`.
- No secret in the repository. Only fictitious data in tests, seeds and screenshots.
- Business rules are checked server-side and in the database (RLS), never only in the UI.

## Time

All business dates are in `Europe/Paris` (`APP_TIME_ZONE` in `src/lib/dates.ts`),
formatted in French.
