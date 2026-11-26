# Architecture

## Stack

- **Next.js 15** (App Router, Server Components by default, Server Actions), **React 19**
- **TypeScript** `strict` + `noUncheckedIndexedAccess`
- **Tailwind CSS v4**, CSS-first: tokens declared with `@theme` in `src/styles/tokens.css`
- **Zod** for environment variables and every input
- **Supabase** (Postgres, magic-link Auth, RLS) from step 2, **Gmail SMTP** for mail from step 3
- Hosted on **Vercel**

## Folders

```
src/
  app/                 routes (French, kebab-case: /mes-sujets, /reunion…)
  components/ui/       design-system building blocks (Button, Card, TopicTag…)
  components/layout/   app shell: header, navigation, background, credit
  lib/                 pure utilities, no I/O (env, cn, dates, topicTags, routes)
  server/              database, mail, business logic — server only
  styles/              tokens.css (design tokens)
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
- Client components (`"use client"`) never import `server/` nor `lib/env.ts`.

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
