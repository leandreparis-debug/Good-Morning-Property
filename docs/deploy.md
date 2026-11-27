# Mise en ligne — pas à pas pour Léandre

Rien n'est déployé automatiquement par Claude : chaque étape ci-dessous est faite par toi, dans
cet ordre. Compte une heure. Garde ce document ouvert à côté.

## 0. Avant de commencer

- La CI de `main` est verte (onglet Actions du dépôt GitHub).
- La branche par défaut du dépôt est `main` (_GitHub → Settings → General → Default branch_).
- Tu as Node 22, pnpm (`corepack enable`) et le dépôt cloné à jour (`git pull` sur `main`).
- Tu as relu les migrations de `supabase/migrations/` (une par fichier, dans l'ordre des noms).

## 1. Créer le projet Supabase de production

1. <https://supabase.com/dashboard> → **New project**.
   - Nom : `good-morning-property`.
   - Région : **UE** (par exemple _West EU (Paris)_).
   - Mot de passe de la base : génère-le, garde-le dans ton gestionnaire de mots de passe.
2. **Authentication → Sign In / Providers → Email** :
   - **désactive « Allow new users to sign up »** (personne ne doit pouvoir créer un compte seul) ;
   - laisse « Confirm email » activé ou non, peu importe : l'application n'envoie aucun mail.
3. **Authentication → Emails** : aucun modèle n'est utilisé par l'application (elle ne passe que
   par `generateLink` côté serveur, qui ne déclenche aucun envoi). Ne configure pas de SMTP.
4. **Authentication → URL Configuration** : _Site URL_ = l'adresse de production Vercel (étape 3),
   à renseigner une fois connue.
5. **Authentication → Rate Limits** : laisse les valeurs par défaut (30 vérifications de jeton par
   5 minutes et par IP suffisent pour 5 personnes).

## 2. Appliquer les migrations (toi seul, après relecture)

Depuis le dossier du dépôt :

```bash
pnpm exec supabase login
```

```bash
pnpm exec supabase link --project-ref <REF_DU_PROJET>
```

(`<REF_DU_PROJET>` : _Project Settings → General → Reference ID_.)

```bash
pnpm exec supabase db push
```

- La commande liste les migrations qu'elle va appliquer et demande confirmation : vérifie la liste.
- **Ne lance jamais le seed en production** (`db push` ne l'applique pas ; n'ajoute pas
  `--include-seed`). Les données de `supabase/seed.sql` sont fictives et réservées au local.
- Vérifie ensuite dans _Table Editor_ que les 4 tables (`members`, `meetings`, `topics`,
  `visits`) affichent « RLS enabled ».

## 3. Créer le projet Vercel

1. <https://vercel.com/new> → importe le dépôt GitHub `Good-Morning-Property`.
2. _Framework_ : Next.js (détecté). _Root directory_ : la racine. _Node.js_ : 22.x
   (_Settings → General_).
3. **Production branch : `main`** (_Settings → Git_).
4. **Variables d'environnement** (_Settings → Environment Variables_, environnement _Production_) :

| Variable                        | Valeur                                   | Où la trouver                                                                                  |
| ------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | `https://<ton-domaine>` (sans `/` final) | l'adresse du projet Vercel (ou ton domaine)                                                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://<ref>.supabase.co`              | Supabase → _Project Settings → API_ → _Project URL_                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publique                             | Supabase → _Project Settings → API Keys_ → clé `anon` / _publishable_                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | clé secrète                              | Supabase → _Project Settings → API Keys_ → clé `service_role` / _secret_ — coche **Sensitive** |

**N'ajoute jamais** `APP_FAKE_NOW` ni `APP_E2E` en production (l'horloge simulée est de toute
façon ignorée sur Vercel production).

5. **Deploy**. Une fois l'adresse connue, reviens à l'étape 1.4 (_Site URL_) et, si besoin,
   corrige `NEXT_PUBLIC_APP_URL` puis redéploie.

## 4. Créer le premier animateur

Sur ton ordinateur, avec les variables de production **dans ta session de terminal uniquement**
(ne les écris dans aucun fichier du dépôt) :

```bash
NEXT_PUBLIC_APP_URL="https://<ton-domaine>" NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="<clé anon>" SUPABASE_SERVICE_ROLE_KEY="<clé service_role>" pnpm bootstrap:facilitator -- --name "Prénom Nom"
```

- Le script refuse de s'exécuter si un animateur actif existe déjà.
- Il affiche **une seule fois** ton lien personnel : ouvre-le, puis garde-le (favori).
- Ferme ensuite le terminal (la clé `service_role` ne doit pas rester dans l'historique :
  `history -d` ou efface la ligne).

## 5. Ajouter l'équipe

1. Ouvre ton lien → onglet **Équipe** → **Ajouter un membre** pour chacun des 4 autres (nom,
   initiales, couleur ; le mail est facultatif et ne sert que d'identifiant).
2. Pour chacun, **Copier** le lien affiché et envoie-le-lui en privé (Teams…).
   Ce lien n'est montré qu'une fois ; en cas d'oubli, **Régénérer le lien** (l'ancien cesse de
   fonctionner aussitôt).
3. Coche **Responsable** pour la personne qui doit voir toutes les saisies avant la réunion, et
   **Animateur** pour celles qui piloteront la réunion.

## 6. Test de bout en bout

- Chaque membre ouvre son lien une fois et arrive sur « Mes sujets ».
- Chacun saisit au moins un sujet (et une visite) ; la préparation affiche « n/5 ont rempli ».
- Répétition de réunion **sur l'écran de la salle** (le lundi après 10:00, ou attends la date
  limite) : cocher les présents, lancer la roue, faire un tour complet, **vérifier le son** à la
  fin du timer (le clic sur « Lancer la roue » débloque l'audio du navigateur), +1/+2/+4 min,
  pause, raccourcis clavier, tour des visites, « Bonne semaine ! ».

## En cas de souci

- Un lien ne marche plus : régénère-le depuis Équipe.
- Une personne quitte l'équipe : **Désactiver** (son lien est révoqué et son compte bloqué).
- Nouvelle migration plus tard : relecture, puis `pnpm exec supabase db push` (jamais d'édition
  d'une migration déjà appliquée).
