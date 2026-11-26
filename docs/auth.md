# Access: personal links

**The app sends no email.** Each member signs in with a **personal secret link**
`https://<app>/l/<token>`. The animateur creates, copies and regenerates links on the
**Équipe** screen and hands them over themselves (Teams…).

## How it works

Supabase Auth is kept (the RLS relies on `auth.uid()`), but no email is ever sent:

1. **Auth account without email.** Every member has an `auth.users` account created server-side
   by the admin client: `auth.admin.createUser({ email, email_confirm: true })`. The email is an
   internal identifier only; when none is given it is `membre-<8 hex>@good-morning.invalid`
   (`.invalid` is a reserved TLD: it can never receive mail).
2. **Token.** 32 random bytes (`crypto.randomBytes`), base64url (43 characters). Only its
   **SHA-256** is stored, in `members.access_token_hash` (+ `access_token_created_at`). Those
   columns are neither readable nor writable by API users (column privileges); only the admin
   client touches them. The full link is shown **once**, when generated.
3. **`/l/[token]`** (Route Handler, `src/app/l/[token]/route.ts`):
   - checks the format, hashes the token and looks up the **active** member (admin client),
     then compares the hashes in constant time;
   - `auth.admin.generateLink({ type: "magiclink", email })` → `properties.hashed_token`
     (the admin endpoint returns the link; it does not send it);
   - `supabase.auth.verifyOtp({ type: "magiclink", token_hash })` with a client bound to the
     response cookies → the Supabase session cookies are set;
   - **303** to `/mes-sujets`: the token leaves the address bar.
   - Any failure (malformed, unknown, revoked, inactive member, auth error) → 303 to
     `/connexion?raison=lien-invalide`: « Ce lien n'est plus valide, demande un nouveau lien à
     ton animateur. » — **the same message in every case**.
4. **Middleware** (`src/middleware.ts`): refreshes the session on every request; no session →
   `/connexion`; session without an active member → `/connexion?raison=inactif` (no sign-out there: the RLS gives an inactive member access to nothing, and Team deactivation bans the account).
5. **Session helpers** (`src/server/auth/session.ts`): `getCurrentMember()` (cached per
   request), `requireMember()`, `requireFacilitator()`, `requireLead()`. Every page and Server
   Action calls one of them; the UI hiding a button is never the guard.

A link stays valid until it is regenerated or the member is deactivated: it can be bookmarked.

## Security

| Measure                                                                            | Where                                                           |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Token never stored, only its SHA-256                                               | `src/server/auth/accessToken.ts`                                |
| Token columns invisible to API users                                               | migration `member_access_links`, pgTAP `05_access_links`        |
| Constant-time hash comparison                                                      | `hashesMatch()`                                                 |
| Same answer whatever the failure                                                   | `/l/[token]`                                                    |
| `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, `X-Robots-Tag: noindex` | `/l/[token]` + `next.config.ts`                                 |
| 10 **failed** attempts per minute and per IP, then « Trop de tentatives »          | `src/server/auth/rateLimit.ts` (in memory, per server instance) |
| Token never logged (no `console`, no error detail)                                 | `/l/[token]`                                                    |
| 303 redirect: the token leaves the address bar and history entry                   | `/l/[token]`                                                    |
| Sign-ups disabled                                                                  | `supabase/config.toml` (`enable_signup = false`)                |
| Deactivation: link revoked + auth account banned (no new session, no refresh)      | `setActive()` in `src/server/team/teamService.ts`               |

## Limits (accepted)

- **Whoever holds the link acts on behalf of the member.** Treat it like a password: send it
  privately, regenerate it if it leaks (the old one stops working at once).
- After a deactivation, an already-issued access token (JWT) stays technically valid until it
  expires (1 h), but the middleware and the RLS (`is_active`) refuse everything right away.
- The rate limit lives in memory: on Vercel it is per function instance, not global.
  Brute force remains hopeless anyway (2^256 possible tokens).
- GoTrue limits verifications per IP (`token_verifications`, 30 per 5 min by default). All
  sign-ins go through the app server, which is fine for a team of five.

## Team screen (`/equipe`, animateurs only)

- Member cards: badge, name, « Animateur » / « Responsable » badges, status, date of the
  current link.
- Add a member (name, suggested initials, colour, optional email) → profile + auth account +
  first link, shown once with a **Copier** button.
- Regenerate a link (confirmation: the old one stops working immediately).
- Edit name, initials, colour; toggle « Animateur »; appoint the « Responsable » (`set_lead`,
  one transaction); deactivate / reactivate.
- Guard rails: nobody deactivates themselves; the last active animateur keeps the role
  (database trigger).

## First animateur (bootstrap)

On an empty database:

```bash
pnpm bootstrap:facilitator -- --name "Prénom Nom" [--initials PN] [--color sun] [--email x@y.z]
```

It reads the environment (`.env.local` if present), refuses to run if an active animateur
already exists, and prints the first link **once** in the terminal.
Locally, `pnpm local:link -- --email membre1@example.test` prints a link for a seed member.
