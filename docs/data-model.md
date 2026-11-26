# Data model

Postgres schema managed by versioned migrations in `supabase/migrations/` (created with
`supabase migration new`, **never edited once committed**: fix forward with a new migration).
The database is the last line of defence: every business rule below is enforced here, and
will also be checked in the app (Server Actions) from step 5 on.

## Schema

```mermaid
erDiagram
  AUTH_USERS ||--o| MEMBERS : "user_id (null until first sign-in)"
  MEMBERS ||--o{ TOPICS : brings
  MEMBERS ||--o{ VISITS : makes
  MEETINGS ||--o{ TOPICS : "agenda of"
  MEETINGS ||--o{ VISITS : "week of"

  MEMBERS {
    uuid id PK
    uuid user_id FK "unique, nullable"
    citext email "unique"
    text display_name "1-60"
    text initials "1-3, uppercase"
    text avatar_color "sun|grass|sky|card|ink"
    boolean is_facilitator "animateur"
    boolean is_lead "responsable, one at most"
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }
  MEETINGS {
    uuid id PK
    date meeting_date "unique, Monday"
    timestamptz entry_deadline "Monday 10:00 Paris"
    timestamptz created_at
  }
  TOPICS {
    uuid id PK
    uuid meeting_id FK
    uuid member_id FK
    text title "1-120"
    text details "0-280, nullable"
    smallint priority "1-5, unique per member+meeting"
    topic_tag tag "INFO|EXCHANGE|DECISION|ALERT"
    timestamptz created_at
    timestamptz updated_at
  }
  VISITS {
    uuid id PK
    uuid meeting_id FK
    uuid member_id FK
    date visit_date "within meeting week"
    text place "1-120"
    text purpose "1-200"
    timestamptz created_at
    timestamptz updated_at
  }
```

- Primary keys `uuid` (`gen_random_uuid()`), timestamps `timestamptz`, SQL names in English `snake_case`.
- Foreign keys from `topics` and `visits` cascade on delete. Members are never deleted (deactivate).
- Every text has a `check` on its length **after `btrim`**: no empty or blank strings.
- `updated_at` is maintained by the generic trigger `private.set_updated_at()`.
- Helpers and trigger functions live in the `private` schema, which the Data API does not expose.

## Business rules and where they are enforced

| Rule                                                                          | Database                                                                                                        | App (later)                     |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A member is active or inactive; inactive members read and write nothing       | `private.current_member_id()` only returns **active** members; every policy depends on it                       | step 3                          |
| One **responsable** at most                                                   | partial unique index `members_single_lead_idx` (23505)                                                          | step 3 (team screen)            |
| At least one active **animateur**                                             | trigger `members_keep_one_facilitator` (P0001, hint `last_facilitator`)                                         | step 3                          |
| A meeting is on a Monday, one per date                                        | `check (extract(isodow …) = 1)`, `unique (meeting_date)`                                                        | step 4                          |
| Entry closes at the stored deadline (Monday 10:00 Paris)                      | RLS (`private.is_entry_open`) + trigger `*_entry_open` for a readable error (P0001, hint `entry_closed`)        | step 4 computes the deadline    |
| 5 topics max per member and meeting                                           | trigger `topics_max_five` (P0001, hint `topics_max_five`), with an advisory lock                                | step 5                          |
| Priority 1–5, unique per member and meeting                                   | `check`, constraint `topics_member_priority_unique` **deferrable initially deferred** (swap in one transaction) | step 5                          |
| One tag among 4                                                               | enum `topic_tag`                                                                                                | step 5 (`src/lib/topicTags.ts`) |
| Visit date within the meeting week (Mon–Sun)                                  | trigger `visits_in_meeting_week` (P0001, hint `visit_outside_meeting_week`)                                     | step 6                          |
| Members only write their own entries; `meeting_id` / `member_id` never change | RLS `with check` + column-level `UPDATE` privileges                                                             | steps 5–6                       |
| `user_id` is linked server-side only                                          | no `INSERT`/`UPDATE` privilege on `members.user_id` for API users                                               | step 3 (admin client)           |
| Nothing kept after the meeting                                                | —                                                                                                               | step 10                         |

Database errors are translated into business errors by `src/server/errors.ts`
(`toDomainError`): codes `TOPICS_LIMIT_REACHED`, `DUPLICATE_PRIORITY`, `ENTRY_CLOSED`,
`VISIT_OUTSIDE_WEEK`, `LEAD_ALREADY_ASSIGNED`, `LAST_FACILITATOR`, `DUPLICATE_EMAIL`,
`INVALID_INPUT`, `FORBIDDEN`, `UNKNOWN`, each with a French message.

## Access rules

RLS is enabled on the 4 tables. Default deny: all privileges are revoked from `anon` and
`authenticated`, then granted table by table (column by column for writes). `anon` has no
privilege at all. `service_role` (admin client, server only) bypasses RLS.

Helper functions (`private` schema, `security definer`, `search_path = ''`, `stable`):

| Function                        | Returns                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `current_member_id()`           | id of the **active** member linked to `auth.uid()`, or null |
| `is_facilitator()`              | current active member has the animateur role                |
| `is_lead()`                     | current active member is the responsable                    |
| `is_entry_open(meeting_id)`     | `now() < entry_deadline`                                    |
| `is_meeting_closed(meeting_id)` | `now() >= entry_deadline`                                   |

| Table      | SELECT                                                            | INSERT                    | UPDATE                                                           | DELETE               |
| ---------- | ----------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- | -------------------- |
| `members`  | any active member                                                 | animateur (not `user_id`) | animateur (not `user_id`)                                        | nobody (deactivate)  |
| `meetings` | any active member                                                 | nobody (admin client)     | nobody                                                           | nobody               |
| `topics`   | own **or** responsable **or** (animateur **and** deadline passed) | own, before deadline      | own, before deadline; only `title`, `details`, `priority`, `tag` | own, before deadline |
| `visits`   | own **or** responsable **or** (animateur **and** deadline passed) | own, before deadline      | own, before deadline; only `visit_date`, `place`, `purpose`      | own, before deadline |

Note: a refused UPDATE or DELETE under RLS is **silent** (0 rows affected). The app checks the
number of affected rows (steps 5–6).

## Tests

`supabase/tests/database/*.test.sql` (pgTAP, `pnpm test:db`): constraints and triggers,
visibility per role and per deadline, writes before/after the deadline and for another
member, inactive members, users without a member profile, anonymous users; plus schema-level
checks (RLS enabled on every `public` table, no `anon` privilege, immutable columns, pinned
`search_path` on security definer helpers). Fixtures are fictitious and rolled back.

## Demo data

`supabase/seed.sql` (loaded by `pnpm db:reset`), **fictitious**: « Membre Démo 1 » to « 5 »
(`membre1@example.test` …; 1 = animateur, 2 = responsable), their auth accounts, next Monday's
meeting with 0 to 5 topics per member (all tags) and a few visits.
