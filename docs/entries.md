# Entry screen (`/mes-sujets`)

Mobile first. Header: overline « POINT DU LUNDI 30 NOVEMBRE » and a greeting
(« Bon*jour*, Prénom », « Bon week-end, _Prénom_ » from Friday 12:00 to Sunday — `src/lib/greeting.ts`).
Two tabs (WAI-ARIA tabs, ←/→): « Sujets n/5 » and « Visites n ».

## Topics

- Numbered white cards by priority (Instrument Serif number), title, optional details, tag pill.
- Add / edit in a **sheet** (`Dialog` on `<dialog>`: focus trapped, Escape closes, bottom sheet
  under 640 px): title (120) and details (280) with counters, tag as **4 large radio pills**
  (colour + icon + label).
- Dashed button « Ajouter un sujet (encore N) »; at 5 it is disabled (« Cinq sujets : c'est le
  maximum »). The server refuses a 6th anyway (service + database trigger).
- **Reorder**: « Monter » / « Descendre » buttons (keyboard, mandatory) and drag and drop
  (`@dnd-kit`, pointer and keyboard sensors, French screen reader messages). Both call
  `reorder_topics` (one transaction, deferred unique constraint).
- Delete with confirmation; remaining priorities are compacted (1..n).
- Optimistic updates: the list changes at once and rolls back with the French error message if
  the server refuses. Each action returns the up-to-date list.
- After the deadline: read-only, banner « Saisie fermée », no buttons. An action sent anyway is
  refused by the server (`ENTRY_CLOSED`) and by the database (RLS + trigger).

## Visits and trips

- « Visites » tab: list by date (« mardi 1er décembre · Lyon · Visite du site X »), add, edit,
  delete (confirmation). No limit on count.
- The date picker (`<input type="date">`) is limited to the meeting week (Monday → Sunday,
  `min` / `max`); the client schema (`src/lib/visitInput.ts`), the server
  (`src/server/visits/visitService.ts`, `VISIT_OUTSIDE_WEEK`) and the database trigger
  `visits_in_meeting_week` refuse any other date.
- Same entry window and same read-only mode after the deadline as topics.

## Server (`src/server/topics/topicService.ts`, `src/server/visits/visitService.ts`)

Every write: `requireOpenEntry()` (session, current meeting, app clock before the stored
deadline) → Zod (`src/lib/topicInput.ts`) → RLS-bound client → row count check
(`expectOneRow`: 0 rows = « saisie fermée » after the deadline, « introuvable » before).
