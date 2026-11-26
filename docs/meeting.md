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
3. **Speaking turns** (`SpeakingTurns.tsx`): « TOUR 2 SUR 5 », the speaker's name in
   `DisplayTitle` projection, their topics as cards (priority number, 26 px title, projection tag,
   details), or « Rien à signaler cette semaine ». Badges row: current (double ring), already
   presented, to come.
   - **Timer** (`src/lib/speakingTimer.ts`, timestamps, no drift): 10:00, +1 / +2 / +4 min,
     pause / resume, next. Progress bar `hill`, `sun` in the last minute. At 0: the card turns
     `ember` (ink text, 4.86:1) with a pulsing halo (static with reduced motion), « TEMPS DÉPASSÉ », three short
     beeps (Web Audio, no file), and the counter keeps going in overtime (« +01:15 »). Nothing
     blocks the animateur.
   - Main button « Suivant : Prénom », then « Passer aux visites ».
   - Shortcuts on this screen only: Space = pause / resume, → = next, 1 / 2 / 4 = add minutes.
4. **Visits round**: for each present member in the drawn order, their visits and trips of the
   week by date, or « Pas de déplacement prévu ». Previous / next.
5. **End**: « Bonne semaine ! » with the total duration. Nothing is stored.

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
- Playwright (`reunion.*.spec.ts`, `turns.closed.spec.ts`, simulated browser clock):
  non-animateur refused, closed before 10:00, attendance and wheel, order kept on reload,
  overtime at 10:00, +2 min pushes the alert back, pause, keyboard shortcuts, visits round, end.
