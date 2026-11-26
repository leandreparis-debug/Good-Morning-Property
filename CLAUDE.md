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
- **Friday 4 pm reminder email** to members who haven't entered anything yet.

## Stack

Next.js 15 (App Router, RSC by default, Server Actions) · React 19 · TypeScript strict
(+ `noUncheckedIndexedAccess`) · Tailwind CSS v4 CSS-first (`@theme`) · Zod · lucide-react ·
clsx + tailwind-merge · Vitest + Testing Library + jsdom · Playwright + axe · pnpm · Node 22.
Later: Supabase (Postgres, magic-link Auth, RLS) from step 2; Gmail SMTP mail from step 3.
Hosting: Vercel.

## Commands

```bash
pnpm dev              # http://localhost:3000
pnpm check            # lint + typecheck + unit tests
pnpm build            # production build
pnpm test:e2e         # Playwright on the build (run `pnpm build` first)
pnpm format           # Prettier (Tailwind classes sorted)
pnpm optimize:background
```

Requires `.env.local` (copy `.env.example`). A missing variable stops the app with a clear message.

## Structure

See `docs/architecture.md`. In short: `src/app` routes → `src/components/{layout,ui}` →
`src/lib` (pure); **only** `src/app` calls `src/server` (database, mail, business rules).

## Conventions

- UI text in **French**; code, file names and commits in **English**.
- Dates formatted in French, time zone `Europe/Paris` (`src/lib/dates.ts`).
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

## Absolute rules

- **Never connect to a remote Supabase project nor apply a migration to it.** Everything
  happens locally; production migrations are applied by Léandre after review.
- **No secret in the repository. No real data in tests or seeds** (fictitious, flagged as such).
- **Every business rule** (5 topics max, entry window, visibility) is enforced **server-side
  and in the database**, never only in the UI.

## Roadmap

1 init & design system ✅ · 2 database & RLS · 3 sign-in & members · 4 week & entry window ·
5 topic entry · 6 visit entry · 7 preparation view · 8 the wheel · 9 speaking turns & timer ·
10 visits & end of meeting · 11 Friday reminder · 12 design & a11y polish · 13 checks & go-live.
