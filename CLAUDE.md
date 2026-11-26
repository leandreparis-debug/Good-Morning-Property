# Good Morning Property

Web app that runs the **weekly meeting of a 5-person team** (Mondays, 11 am, Paris time).
Problem it solves: everyone used to list last week's tasks, the meeting ran long and real
topics never came up. The app enforces short preparation and limited speaking time.

## Product rules

- **Entry window: Tuesday → Monday 10 am (Europe/Paris).** Each member enters up to
  **5 topics** for the next Monday, each with a **priority 1–5** and **one tag**:
  Pour info, Pour échange, Pour décision, Pour alerte. They also enter their **visits and
  trips** for the coming week (date, place, purpose).
- **Before the meeting** each member sees only their own entries. Only the member with the
  **responsable** role sees everyone's.
- **Monday**, the app is **projected** and an **animateur** member drives it: a **wheel**
  draws the speaking order, then each member presents with a **10 min timer**. The
  facilitator can add 1, 2 or 4 min. When time is up, a visual and audible alert fires
  without cutting anyone off. The meeting ends with the visits/trips round.
  **Nothing is stored after the meeting** (no minutes).
- **No email, ever.** Each member signs in with a **personal secret link** `/l/<token>`;
  animateurs create, copy and regenerate links on the **Équipe** screen and hand them over
  themselves (Teams…). See `docs/auth.md`.

## Stack

Next.js 15 (App Router, RSC by default, Server Actions) · React 19 · TypeScript strict
(+ `noUncheckedIndexedAccess`) · Tailwind CSS v4 CSS-first (`@theme`) · Zod · lucide-react ·
clsx + tailwind-merge · Vitest + Testing Library + jsdom · Playwright + axe · pnpm · Node 22.
Supabase (Postgres, Auth, RLS) via `@supabase/supabase-js` + `@supabase/ssr`,
**local stack only** (Supabase CLI as a dev dependency, Docker). No SMTP, no email.
Hosting: Vercel.

## Commands

```bash
pnpm dev              # http://localhost:3000
pnpm check            # lint + typecheck + unit tests
pnpm build            # production build
pnpm test:e2e         # Playwright on the build (run `pnpm build` first)
pnpm format           # Prettier (Tailwind classes sorted)
pnpm optimize:background

pnpm db:start         # local Supabase stack (Docker)
pnpm db:reset         # migrations + fictitious seed, LOCAL database
pnpm test:db          # pgTAP tests (supabase/tests/database)
pnpm db:types         # regenerate src/server/supabase/database.types.ts (commit it)
pnpm db:env           # local Supabase variables for .env.local
pnpm local:link -- --email membre1@example.test   # personal link for a seed member (local only)
pnpm bootstrap:facilitator -- --name "…"          # first animateur of an empty database
```

E2E tests need the local stack: `pnpm db:start && pnpm db:reset && pnpm build && pnpm test:e2e`
(serial, shared database; sign-in helpers in `tests/e2e/support/`). One server per fake clock
(`tests/e2e/support/clocks.ts`): `*.open.spec.ts`, `*.soon.spec.ts`, `*.closed.spec.ts`.
`pnpm test:integration` runs Vitest integration tests against the local stack.

Requires `.env.local` (copy `.env.example`). A missing variable stops the app with a clear message.
A new required variable goes in `src/lib/env.ts`, `.env.example` **and** the CI workflow.

No Docker (cloud sessions): write migrations/seed/pgTAP, run everything that doesn't need the
database, push, and validate the database through the CI `database` job. Details:
`docs/local-dev.md`. Data model and RLS table: `docs/data-model.md`.

## Structure

See `docs/architecture.md`. In short: `src/app` routes → `src/components/{layout,ui}` →
`src/lib` (pure); **only** `src/app` calls `src/server` (database, sessions, business rules).
Pages and actions start with `requireMember()` / `requireFacilitator()` / `requireLead()`
(`src/server/auth/session.ts`). Server Actions return `ActionResult` via `runAction()`, and
check the number of rows touched (RLS refusals are silent).

## Conventions

- UI text in **French**; code, file names and commits in **English**.
- Dates formatted in French, time zone `Europe/Paris` (`src/lib/dates.ts`). Meeting dates,
  deadlines and phases only via `src/lib/meetingCalendar.ts` (pure, `now` passed in); the
  server's `now` comes from `src/server/clock.ts` (never `new Date()` for business rules).
  See `docs/calendar.md`. Entry screens: `docs/entries.md`.
- Every write to topics/visits goes through `requireOpenEntry()` (`src/server/entries/`) and
  checks the rows touched with `expectOneRow()`.
- Components `PascalCase.tsx`, utilities `camelCase.ts`, routes in French kebab-case
  (`/mes-sujets`, `/reunion`).
- Hand-written UI components in `src/components/ui/` (no component library). JSDoc on each.
- Tag mapping only via `src/lib/topicTags.ts`. Classes merged with `cn()`.
- No `any`, no `console.log`. Zod for env and every input.
- Unit tests next to the file (`*.test.ts(x)`), e2e in `tests/e2e/`.
- Conventional Commits, pushed as you go.

## Design

Art direction « Prairie du matin », frozen: **`docs/design.md`** and the `/design` page.
Tokens in `src/styles/tokens.css`. No emoji, lucide line icons. WCAG 2.1 AA, visible focus,
targets ≥ 44 px, inputs 16 px on mobile, `prefers-reduced-motion` respected. A tag is
colour **and** icon **and** label.

## Database

- Migrations in `supabase/migrations/`, created with `pnpm exec supabase migration new <name>`,
  **never edited once committed** (fix forward). SQL in English `snake_case`, `uuid` keys,
  `timestamptz`, `comment on` every object.
- RLS on every table, default deny, explicit (column-level) privileges. Helpers in the
  `private` schema (`security definer`, `search_path = ''`).
- Trigger errors: SQLSTATE `P0001` + machine-readable `HINT`, mapped in `src/server/errors.ts`.
- Pages never query Supabase directly: `src/server/repositories/` (RLS-bound server client).
  The admin client (`service_role`) is for server tasks only.

## Absolute rules

- **Supabase runs locally only.** Never link or connect to a hosted Supabase project, never
  apply a migration to it, and never use a Supabase connector or MCP tool. Production
  migrations are applied by Léandre after review.
- **No secret in the repository. No real data in tests or seeds** (fictitious, flagged as such).
- **Every business rule** (5 topics max, entry window, visibility) is enforced **server-side
  and in the database**, never only in the UI.

## Roadmap

Phases (one PR each, see `docs/progress.md`): A step 2 merged ✅ · B personal links & Team ✅ ·
C meeting calendar ✅ · D topic entry ✅ · E visit entry · F preparation · G attendance & wheel ·
H speaking turns, timer & visits · I design & a11y polish · J checks & go-live prep.
