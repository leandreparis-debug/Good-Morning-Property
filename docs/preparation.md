# Preparation (`/preparation`)

What the team has prepared for the coming meeting.

| Who          | Sees                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every member | the grid of active members with « 4 sujets · 1 alerte · 2 visites » or « Rien pour l'instant », and a **sun card**: « 4/5 ont rempli », number of topics, planned duration (members × 10 min) |
| Animateur    | in addition, next to each member who has nothing: « Relance-le avec son lien » (link to `/equipe`)                                                                                            |
| Responsable  | in addition, each member's content, folded (`<details>`): topics by priority with tags, visits by date                                                                                        |

## Data

- Counts come from `public.meeting_fill_status(meeting_id)` (migration `meeting_fill_status`):
  `security definer`, `search_path = ''`, **active members only** (42501 otherwise), returns
  `member_id, topics_count, visits_count, alerts_count` for every active member — never any
  content. The topics themselves stay behind the RLS.
- The responsable's content comes from the usual repositories (`listTopicsForMeeting`,
  `listVisitsForMeeting`): the RLS gives the lead everyone's rows. For anyone else these lists are
  not even fetched, so no content reaches the page (checked by e2e on the raw server response).
- Formatting: `src/lib/fillSummary.ts` (plurals, overview, « 1 h 10 »).

## Tests

- pgTAP `07_meeting_fill_status`: counts per active member, still no access to the topics, only
  count columns, inactive / no profile / anonymous refused.
- Vitest: `fillSummary`.
- Playwright: a plain member sees the counts and no title (HTML + RSC payload checked), the
  animateur gets the reminder link, the responsable sees the content.
