# Local development

## Golden rule

**Supabase runs locally only.** Never link or connect to a hosted Supabase project, never
apply a migration to it, never use a Supabase connector or MCP tool. Production migrations
are applied by Léandre after review.

## Prerequisites

- Node 22, pnpm (`corepack enable`)
- **Docker Desktop** running (the Supabase CLI starts the stack in containers)
- The Supabase CLI is a dev dependency: always call it through `pnpm` (`pnpm exec supabase …`).

## First start

```bash
pnpm install
pnpm db:start            # starts the local stack (first run downloads the images)
pnpm db:reset            # applies migrations + seed (fictitious data)
pnpm db:env              # prints the 3 Supabase variables for .env.local
cp .env.example .env.local   # then paste the values printed above
pnpm dev
```

## Local URLs

| Service                                                                                 | URL                                                       |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| App                                                                                     | <http://localhost:3000>                                   |
| Supabase API                                                                            | <http://127.0.0.1:54321>                                  |
| Supabase Studio (tables, RLS, SQL)                                                      | <http://127.0.0.1:54323>                                  |
| Mail catcher (Mailpit, formerly Inbucket): must stay **empty** (the app sends no email) | <http://127.0.0.1:54324>                                  |
| Postgres                                                                                | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Realtime, Storage, Edge Functions and Analytics are disabled in `supabase/config.toml`
(the app doesn't use them).

## Everyday commands

| Command                          | What it does                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm db:start` / `pnpm db:stop` | start / stop the local stack                                                    |
| `pnpm db:status`                 | URLs and keys of the running stack                                              |
| `pnpm db:env`                    | the same, as `.env.local` lines                                                 |
| `pnpm db:reset`                  | drops the local database, re-applies every migration, loads `supabase/seed.sql` |
| `pnpm test:db`                   | pgTAP tests (`supabase/tests/database/`)                                        |
| `pnpm db:types`                  | regenerates `src/server/supabase/database.types.ts`                             |

## Changing the schema

1. `pnpm exec supabase migration new <short_name>` creates
   `supabase/migrations/<timestamp>_<short_name>.sql`.
2. Write the SQL (comments on every object, RLS on every new table, privileges explicit).
3. `pnpm db:reset && pnpm test:db`, add pgTAP tests for the new rules.
4. `pnpm db:types` and commit the regenerated types (CI fails if they differ).
5. **Never edit a committed migration**: fix forward with a new one.

## Signing in locally

The seed creates the members `membre1@example.test` … `membre5@example.test` (fictitious;
1 = animateur, 2 = responsable). Print a personal link for one of them, then open it:

```bash
pnpm local:link -- --email membre1@example.test
```

The script refuses to run against anything but the local stack. On an empty database, create
the first animateur with `pnpm bootstrap:facilitator -- --name "Prénom Nom"` instead.
How links work: `docs/auth.md`.

## Without Docker (cloud sessions)

Cloud coding sessions have no Docker. There, the migrations, seed, pgTAP tests and types are
validated by the `database` job of the CI (`.github/workflows/ci.yml`), which runs
`supabase start`, `db reset`, `db lint`, `test db` and checks that the generated types match.
