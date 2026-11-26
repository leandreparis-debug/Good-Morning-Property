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
