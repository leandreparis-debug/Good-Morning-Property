# Good Morning Property

Application web qui anime le point hebdomadaire d'une équipe de cinq personnes, le lundi à 11 h :
préparation courte (5 sujets maximum, tagués et priorisés), tirage au sort de l'ordre de passage,
temps de parole chronométré, tour des visites et déplacements. Rien n'est conservé après la réunion.

Pas de mot de passe ni de mail : chaque membre entre avec son **lien personnel**, que
l'animateur crée et lui transmet depuis l'écran Équipe (`docs/auth.md`).

## Prérequis

- **Node 22 LTS** (`nvm use` lit `.nvmrc`)
- **pnpm 10** (`corepack enable` utilise la version figée dans `package.json`)
- **Docker Desktop** (Supabase tourne en local, voir `docs/local-dev.md`)

## Installation

```bash
corepack enable
pnpm install
pnpm db:start && pnpm db:reset        # Supabase local + données fictives
cp .env.example .env.local            # puis coller les valeurs de `pnpm db:env`
pnpm dev
pnpm local:link -- --email membre1@example.test   # lien de connexion d'un membre fictif
```

Puis ouvrir <http://localhost:3000> (redirige vers `/mes-sujets`) et <http://localhost:3000/design>.

## Commandes

| Commande                       | Rôle                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `pnpm dev`                     | serveur de développement                                     |
| `pnpm build` / `pnpm start`    | build de production / serveur de production                  |
| `pnpm lint`                    | ESLint (Next + typescript-eslint strict)                     |
| `pnpm typecheck`               | TypeScript sans émission                                     |
| `pnpm format` / `format:check` | Prettier (+ tri des classes Tailwind)                        |
| `pnpm test` / `test:watch`     | tests unitaires Vitest                                       |
| `pnpm test:e2e`                | tests Playwright + axe sur le build (`pnpm build` avant)     |
| `pnpm check`                   | lint + typecheck + tests unitaires                           |
| `pnpm optimize:background`     | régénère le flou de la photo de fond (ré-encode si > 600 Ko) |

Première exécution des tests e2e en local : `pnpm exec playwright install chromium`.

## Documentation

- `CLAUDE.md` : contexte, conventions et règles absolues du projet
- `docs/design.md` : direction artistique « Prairie du matin »
- `docs/architecture.md` : structure et règles de dépendance
- `docs/auth.md` : liens personnels et écran Équipe
- `docs/data-model.md`, `docs/local-dev.md` : base de données, Supabase local
- `docs/progress.md` : avancement par phase

## Crédits

Photo de fond : « Rolling green hills under a bright, blue sky », **Spencer DeMera** sur
[Unsplash](https://unsplash.com/photos/q0lB6w0z6Ns), licence Unsplash.
Polices : Instrument Serif et Inter Tight (SIL Open Font License), via Google Fonts.
