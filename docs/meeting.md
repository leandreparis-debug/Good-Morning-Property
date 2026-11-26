# Meeting mode (`/reunion`)

Projected on the meeting room screen (designed for 1920×1080, readable at 4 m: `projection`
sizes), driven by an **animateur** only. Before Monday 10:00 the screen only says « La réunion
s'ouvre lundi à 10:00 » — on purpose: the others' content is not readable before the deadline
(RLS). There is no sync between screens: everything happens on the projected one.

## Steps

Stepper « 1. La roue · 2. Tours de parole · 3. Visites ».

1. **Attendance**: « Présents aujourd'hui », everyone checked by default, « Anime » badge on the
   signed-in animateur. Unchecking someone removes them from the wheel (and cancels a draw).
2. **Wheel** (`Wheel.tsx`, SVG): one slice per present member in their badge colour, first names
   (full names when two first names collide). « Lancer la roue » draws the **whole order once**
   (`drawOrder`, Fisher–Yates with `crypto.getRandomValues` and rejection sampling), then the
   wheel spins 3.6 s (ease-out) and stops on the first speaker; the full order appears.
   « Relancer » is possible until the first turn starts. With `prefers-reduced-motion`, no spin:
   the order is revealed at once. The click also unlocks Web Audio for the alert.
3. **Speaking turns, timer, visits round, end**: phase H (`SpeakingTurns.tsx` is a placeholder here).

## State

`src/lib/meetingState.ts` — pure transitions (attendance, draw, turns, timer, visits, end),
serialized in `localStorage` under `gmp:reunion:<meeting date>` so that a reload keeps the
attendance, the order, the current turn and the timer. Restoring ignores a state for another
meeting or with unknown members. « Recommencer la réunion » resets it. **Nothing is written to
the database.**

## Tests

- Vitest: `drawOrder` (permutation, uniformity over 60 000 draws ±3 %, empty / single),
  `speakingTimer` (countdown, added minutes, pause, overtime, reload from saved state),
  `meetingState` (transitions, restore).
- Playwright (`reunion.*.spec.ts`): non-animateur refused, closed before 10:00, attendance and
  wheel, order kept on reload, spin before reveal.
