# Meeting calendar

Everything is computed in **Paris time** (`Europe/Paris`, DST included) by the pure module
`src/lib/meetingCalendar.ts` (`date-fns` v4 + `@date-fns/tz`). Every function takes `now`
as a parameter: no hidden clock. Bank holidays are out of scope.

## Rules

| Moment (Paris)               | Current meeting             | Entry                             |
| ---------------------------- | --------------------------- | --------------------------------- |
| Tuesday 00:00 → Sunday 23:59 | next Monday                 | open                              |
| Monday 00:00 → 09:59:59      | that Monday (`meeting-day`) | open                              |
| Monday 10:00 → 23:59         | that Monday (`meeting-day`) | **closed** — time for the meeting |
| Tuesday 00:00                | the following Monday        | open again                        |

The deadline (Monday 10:00 Paris) is 09:00 UTC in winter and 08:00 UTC in summer. It is
computed by the app and **stored** in `meetings.entry_deadline`; the database (RLS, triggers)
only compares `now()` with that stored value.

## API (`src/lib/meetingCalendar.ts`)

| Function                          | Returns                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `getCurrentMeetingDate(now)`      | `YYYY-MM-DD` of the current meeting (a Monday)                                                    |
| `getEntryDeadline(date)`          | the Monday at 10:00 Paris, as a `Date`                                                            |
| `getEntryOpensAt(date)`           | the previous Tuesday at 00:00 Paris                                                               |
| `getMeetingWeek(date)`            | `{ start, end, days }`, Monday → Sunday                                                           |
| `getMeetingPhase(now)`            | `{ meetingDate, phase: "collecting" \| "meeting-day", entryOpen, deadline, opensAt, timeLeftMs }` |
| `formatMeetingDateFr(date)`       | « lundi 30 novembre », « mardi 1er décembre »                                                     |
| `formatDeadlineFr(deadline, now)` | « lundi 10:00 », or « dans 2 h 15 » / « dans 45 min » under 24 h                                  |

## Server

- `src/server/clock.ts` — `now()`: the instant for business rules. `APP_FAKE_NOW` (ISO 8601)
  overrides it in development and tests; it is **ignored** on Vercel production
  (`VERCEL_ENV=production`) and in any production build (`NODE_ENV=production`), except the
  local e2e suite, which runs the production build with `APP_E2E=1`.
- `src/server/meetings/currentMeeting.ts` — `getOrCreateCurrentMeeting()`: idempotent and safe
  under concurrency (`insert … on conflict (meeting_date) do nothing`, then read back, admin
  client). `getMeetingByDate()` reads through the RLS.

## Header pill

`MeetingStatusPill` (signed-in members): « Saisie ouverte jusqu'à lundi 10:00 »,
« Fermeture dans 2 h 15 » (under 24 h), « Saisie fermée : place à la réunion ».
A coloured dot (meadow / sun / ink) doubles the text, never replaces it.

## Tests

- Vitest `meetingCalendar.test.ts`: Tuesday 00:00, Monday 09:59:59 / 10:00:00, Monday 23:59,
  Sunday evening, winter switch (25/10/2026), summer switch (28/03/2027), new year
  (Tuesday 29/12/2026 → Monday 04/01/2027). `clock.test.ts`: `APP_FAKE_NOW` ignored in production.
- Integration (`pnpm test:integration`, local stack): concurrent calls create one meeting.
- Playwright: one server per fake clock (`tests/e2e/support/clocks.ts`), files `*.open.spec.ts`,
  `*.soon.spec.ts`, `*.closed.spec.ts`. Open states use 2099 and the closed state 2020, so that
  the database's real `now()` agrees with the app's fake time.
