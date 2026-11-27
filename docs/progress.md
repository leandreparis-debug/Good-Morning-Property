# Progress

One line block per phase (what is done, PR, points of attention).

## A · Step 2 merged

Database, RLS, seed, pgTAP and Supabase clients merged into `main` —
[PR #3](https://github.com/leandreparis-debug/Good-Morning-Property/pull/3).

## B · Personal links and Team screen

No email anywhere: personal links `/l/<token>` (SHA-256 stored, admin-only columns), middleware,
session helpers, `/equipe` (add, edit, roles, links, deactivation), `set_lead`, bootstrap script.
Attention: e2e now needs the local Supabase stack (CI `e2e` job); in-memory rate limit per instance.
Merged: [PR #4](https://github.com/leandreparis-debug/Good-Morning-Property/pull/4).

## C · Meeting calendar

Pure `meetingCalendar.ts` (Paris time, DST, new year), `clock.ts` (`APP_FAKE_NOW`, ignored in
production), idempotent `getOrCreateCurrentMeeting()`, header pill with three states.
Attention: e2e uses one server per fake clock (2099 = open, 2020 = closed) so DB and app agree.
Merged: [PR #5](https://github.com/leandreparis-debug/Good-Morning-Property/pull/5). Fonts are now self-hosted (Google Fonts fetch was flaky at build).

## D · Topic entry

`/mes-sujets`: greeting, tabs, topic cards, sheet with tag radio pills and counters, reorder by
buttons and drag and drop (`reorder_topics`, one transaction), delete + compaction, read-only after
the deadline, optimistic updates. Attention: drag and drop is an extra; the buttons are the reference.
Merged: [PR #6](https://github.com/leandreparis-debug/Good-Morning-Property/pull/6). Ids are validated with `z.guid()` (seed ids are not RFC 4122).

## E · Visit entry

« Visites » tab: list by date, add / edit / delete, date limited to the meeting week (client,
server and trigger), read-only after the deadline, optimistic updates.
Merged: [PR #7](https://github.com/leandreparis-debug/Good-Morning-Property/pull/7).

## F · Preparation

`meeting_fill_status` (counts only, active members), `/preparation`: who filled what, sun card
(n/5, topics, planned duration), reminder link for animateurs, folded content for the lead.
Attention: non-lead pages never fetch content (checked on the raw server response).
Merged: [PR #8](https://github.com/leandreparis-debug/Good-Morning-Property/pull/8).

## G · Meeting: attendance and wheel

`/reunion` (animateurs, closed before Monday 10:00): attendance, SVG wheel, whole order drawn once
(Fisher–Yates + `crypto.getRandomValues`), 3.6 s spin (none with reduced motion), redraw, state in
localStorage. Attention: nothing is written to the database; audio is unlocked by the draw click.
Merged: [PR #9](https://github.com/leandreparis-debug/Good-Morning-Property/pull/9).

## H · Speaking turns, timer and visits

Turn screen (topics by priority, badges row), timestamp-based timer (+1/+2/+4, pause, overtime in
ember with halo and 3 Web Audio beeps), shortcuts (Space, →, 1/2/4), visits round, « Bonne semaine ! ».
Attention: the sound needs the « Lancer la roue » click (browser autoplay rules).
Merged: [PR #10](https://github.com/leandreparis-debug/Good-Morning-Property/pull/10).

## I · Design and accessibility polish

AA « already presented » badge (mist, ink-soft, check) and the axe exclusion removed; loading
skeleton, French error page, 404 title; breakpoints 390–1920, unique titles; reference screenshots.
Visual QA from CI screenshots: full-width projection, readable shortcuts, initials on the wheel
when first names clash, mobile header and static credit. Attention: overtime text is ink on ember.
Merged: [PR #11](https://github.com/leandreparis-debug/Good-Morning-Property/pull/11).

## J · Checks and go-live preparation

Full suite green in CI (`ci`, `database`, `e2e`); security review in `docs/security.md` (headers,
`server-only` on every server module, tokens never logged, RLS everywhere, fake clock off in
production); `pnpm audit` clean thanks to a `postcss` override; `docs/deploy.md` step by step for
Léandre; final README. Attention: the repository's default branch must be set to `main`.

## Go-live (2026-11-27)

At the user's request, Claude did the go-live: Supabase project `good-morning-property` (eu-west-3,
6 migrations, no seed), Vercel project `good-morning-property` (team Carrefour Property, `main`,
Node 22, Vercel Authentication off), first animateur created with the bootstrap script.
Production: <https://good-morning-property.vercel.app>. Still to do by hand: disable sign-ups.
