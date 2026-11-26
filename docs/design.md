# Design system — « Prairie du matin »

Validated art direction (2026-11-26). **Frozen**: do not reinterpret it. Any change starts
here, then `src/styles/tokens.css`, then `/design`.

Intent: a clear sky, white cards resting on it, hills anchoring the bottom of the screen.
Readable from afar when projected (Monday), calm on a phone (Friday evening).

Live reference: **`/design`** page (every component, every state).

## Colour tokens

Declared in `src/styles/tokens.css` (`@theme`), used as Tailwind classes (`bg-sky`, `text-muted`…).

| Token      | Value     | Usage                                                                  |
| ---------- | --------- | ---------------------------------------------------------------------- |
| `sky`      | `#B9D6F2` | top of the background, colour while the photo loads                    |
| `sky-mid`  | `#D6E7F8` | middle of the background                                               |
| `mist`     | `#EAF3FC` | bottom of the background, soft buttons (+1/+2/+4 min), progress tracks |
| `ink`      | `#0E1A24` | text, primary button                                                   |
| `ink-soft` | `#2F4A5E` | secondary text on the sky                                              |
| `muted`    | `#5B6B78` | overlines and labels **on white cards only**                           |
| `card`     | `#FFFFFF` | cards                                                                  |
| `line`     | `#C9D8E6` | borders                                                                |
| `grass`    | `#9CC46B` | light hill, badges                                                     |
| `meadow`   | `#6E9E45` | middle hill                                                            |
| `hill`     | `#4F7F32` | dark hill, timer progress bar                                          |
| `sun`      | `#F7C948` | accent: arrow badge in buttons, facilitator badge, one sun card/screen |
| `ember`    | `#E8553D` | **reserved for timer overrun**                                         |

### Measured contrasts (WCAG 2.1)

| Pair                       | Ratio      | Verdict                               |
| -------------------------- | ---------- | ------------------------------------- |
| `muted` on `card`          | 5.50       | AA — the floor for text on white      |
| `muted` on `sky`           | 3.66       | **fails** — use `ink-soft` on the sky |
| `ink-soft` on `sky`        | 6.17       | AA                                    |
| white on `ink`             | 17.6       | AAA                                   |
| `ink` on `sun` / `grass`   | 11.3 / 8.8 | AAA                                   |
| tag text on tag background | 5.4 – 6.4  | AA (all four)                         |

Never go below `muted` for text on white.

## Topic tags

Mapping: `src/lib/topicTags.ts` (`getTopicTagMeta`) — the single source, reused everywhere.
A tag is **colour + icon + label**, never colour alone (readable in black and white).

| Value      | Label         | Background | Text      | lucide icon      | Tokens               |
| ---------- | ------------- | ---------- | --------- | ---------------- | -------------------- |
| `INFO`     | Pour info     | `#DCE8FB`  | `#1D4F9E` | `Info`           | `tag-info-bg/fg`     |
| `EXCHANGE` | Pour échange  | `#D9F0E1`  | `#1F6B3E` | `MessagesSquare` | `tag-exchange-bg/fg` |
| `DECISION` | Pour décision | `#FBE9B7`  | `#7A4F00` | `CircleCheck`    | `tag-decision-bg/fg` |
| `ALERT`    | Pour alerte   | `#FBDAD3`  | `#A3261A` | `TriangleAlert`  | `tag-alert-bg/fg`    |

## Typography

Self-hosted with `next/font/local` (`src/app/fonts/`, latin subset downloaded from Google Fonts, SIL OFL 1.1 in `src/app/fonts/OFL.txt`): the build needs no network.

- **Instrument Serif** 400, normal + italic → `font-display`: screen titles, first names,
  priority numbers, key figures, timer. In large titles, one word in italics
  (« Qui _commence_ ? ») — `DisplayTitle` `italic` prop.
- **Inter Tight** 400/500/600/700 → `font-sans`: the whole interface.

| Role                     | Size                                                 | Class                             |
| ------------------------ | ---------------------------------------------------- | --------------------------------- |
| Screen title             | 44 px mobile (56 from 640 px)                        | `text-screen sm:text-[56px]`      |
| Screen title, projection | 84 → 104 px (`clamp`)                                | `text-screen-projection`          |
| Card title               | 22 px (26 in projection)                             | `text-card-title` / `-projection` |
| Body                     | 16 px                                                | `text-base`                       |
| Overline                 | 12 px (16 in projection), caps, 0.14em, 600, `muted` | `Eyebrow`                         |
| Timer                    | 168 px, `tabular-nums`                               | `text-timer tabular-nums`         |

Form fields are never under 16 px (no zoom on iOS).

## Shapes

- **Card**: `card` background, radius 28 px (22 px under 640 px), shadow
  `0 12px 32px rgba(30,60,90,.10)` (`shadow-card`, `rounded-card`, `rounded-card-sm`).
- **Veiled card**: `card` at 62 % + 1 px white border — secondary info.
- **Sun card**: `sun` background, `ink` text — key figures, **one per screen**.
- **Buttons**: pills, min height 48 px (68 px in projection).
  - Primary: `ink` background, white text, round `sun` badge on the right with an `ink` icon
    (arrow by default).
  - Secondary: white, 1.5 px `line` border.
  - Soft: `mist`, radius 16 px (`rounded-soft`) — timer +1/+2/+4 min.
- **Member badge**: circle with initials (700) on `sun`, `grass`, `sky`, `card` or `ink`
  (white text on `ink`). No photo.

## Components (`src/components/ui/`)

| Component      | Variants / props                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | `variant` primary · secondary · soft; `size` md · projection; `icon`; `loading` (→ `aria-busy`, disabled); `disabled`                   |
| `Card`         | `variant` default · veiled · sun; `size` md · projection; `as`                                                                          |
| `TopicTag`     | `tag` INFO · EXCHANGE · DECISION · ALERT; `size` sm · md · projection                                                                   |
| `MemberAvatar` | `name`, `color`, `size` sm · md · lg · projection; `status` idle · current (4 px white ring then 2 px `ink` ring) · done (45 % opacity) |
| `Eyebrow`      | `tone` card (`muted`) · sky (`ink-soft`); `size`                                                                                        |
| `DisplayTitle` | `italic` word; `as` h1 · h2 · h3 · p; `size` md · projection                                                                            |
| `Field`        | `label`, `hint`, `error` — wired with `aria-describedby`, `aria-invalid`                                                                |
| `Logo`         | `withWordmark`, `size`                                                                                                                  |

Class names are merged with `cn()` (`src/lib/cn.ts`, clsx + tailwind-merge).

## Background photo

« Rolling green hills under a bright, blue sky » by **Spencer DeMera**, Unsplash
(<https://unsplash.com/photos/q0lB6w0z6Ns>), Unsplash licence. File:
`public/images/background-hills.jpg` (2400×1600, 547 KB).

- `SkyBackground` (`src/components/layout/`): fixed, `aria-hidden`, `next/image` `fill`
  `priority` `object-cover`, blurred placeholder, `sky` colour while loading.
- Framing: `BACKGROUND_POSITION = "40% 75%"` (`src/lib/background.ts`). The photo has sky on
  its top two thirds and grass on the bottom third. y 75 % keeps the grass band at the bottom
  of wide (16:9) screens; x 40 % keeps the left hill and the clouds on portrait phones.
- `sizes = "(max-aspect-ratio: 3/2) 150vh, 100vw"`: on a portrait phone `object-cover` crops
  the sides, so the image must be 1.5× the viewport height wide. With plain `100vw` a phone got
  a 640 px image stretched to ~1270 px (blurry). next/image then serves AVIF/WebP at the
  right width (≈1200 px on a phone, 2400 px on a projector).
- Veil: vertical gradient from `mist` at 35 % (top) to transparent at 60 % height.
  Important text stays on white cards.
- Credit « Photo : Spencer DeMera / Unsplash », bottom right on a 70 % white pill, linking to
  the photo page (`PhotoCredit`). Hidden in projection mode (`/reunion`), shown elsewhere
  (incl. `/connexion` and `/design`).
- `pnpm optimize:background` regenerates the blur placeholder; it re-encodes AVIF/WebP/JPEG
  at 2400 and 1200 px only if the source exceeds 600 KB (not the case today).
- To change the photo: only `public/images/` and the constants in `src/lib/background.ts`.

## Logo

`Logo` component, inline SVG: rounded `ink` square (radius 20/64), `sun` disc rising behind a
`grass` hill, three small `sun` rays. Wordmark: « good morning » (`font-display`, lowercase)
over « PROPERTY » (`font-sans` 600, caps, 0.32em). `role="img"`, `aria-label="Good Morning Property"`.
Favicon: `src/app/icon.svg` (same drawing).

## Rules

- No emoji; `lucide-react` line icons only, `aria-hidden` when next to a label.
- WCAG 2.1 AA, visible focus (3 px `ink` outline), targets ≥ 44 px.
- `prefers-reduced-motion` is honoured globally (animations and transitions cut).
  Later: the wheel spins without a long animation, the overrun halo does not pulse.
- Timer overrun turns the card `ember` with a pulsing halo and a short sound, without
  blocking the facilitator.
- Projection mode = the meeting screen (`/reunion`): `projection` sizes, no photo credit.
