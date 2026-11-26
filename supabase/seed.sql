-- =============================================================================
-- DEMO DATA — FICTITIOUS. No real person, email or project.
-- Loaded by `pnpm db:reset` (supabase db reset) on the LOCAL database only.
-- =============================================================================
--
-- 5 members « Membre Démo 1 » to « Membre Démo 5 » (membre1@example.test …):
--   1 = animateur (facilitator), 2 = responsable (lead), 3 to 5 = members.
-- Their auth accounts exist, so you can sign in locally with a magic link
-- (emails land in the local mail catcher, see docs/local-dev.md).
-- One meeting next Monday, entry open until Monday 10:00 Paris time,
-- 0 to 5 topics per member (every tag used) and a few visits.

-- -----------------------------------------------------------------------------
-- Auth accounts (passwordless: magic link only)
-- -----------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('00000000-0000-4000-a000-00000000000' || n)::uuid,
  'authenticated',
  'authenticated',
  'membre' || n || '@example.test',
  '',
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('demo', true),
  now(),
  now(),
  '', '', '', '', '', '', '', ''
from generate_series(1, 5) as n;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  ('00000000-0000-4000-a000-00000000000' || n),
  ('00000000-0000-4000-a000-00000000000' || n)::uuid,
  jsonb_build_object(
    'sub', '00000000-0000-4000-a000-00000000000' || n,
    'email', 'membre' || n || '@example.test',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
from generate_series(1, 5) as n;

-- -----------------------------------------------------------------------------
-- Members
-- -----------------------------------------------------------------------------

insert into public.members (id, user_id, email, display_name, initials, avatar_color, is_facilitator, is_lead)
values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001',
   'membre1@example.test', 'Membre Démo 1', 'MD1', 'sun', true, false),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002',
   'membre2@example.test', 'Membre Démo 2', 'MD2', 'grass', false, true),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003',
   'membre3@example.test', 'Membre Démo 3', 'MD3', 'sky', false, false),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000004',
   'membre4@example.test', 'Membre Démo 4', 'MD4', 'card', false, false),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000005',
   'membre5@example.test', 'Membre Démo 5', 'MD5', 'ink', false, false);

-- -----------------------------------------------------------------------------
-- Next Monday's meeting (strictly after today, Paris time); entry closes Monday 10:00 Paris.
-- -----------------------------------------------------------------------------

insert into public.meetings (id, meeting_date, entry_deadline)
select
  '00000000-0000-4000-c000-000000000001',
  next_monday,
  (next_monday + time '10:00') at time zone 'Europe/Paris'
from (
  select (date_trunc('week', now() at time zone 'Europe/Paris')::date + 7) as next_monday
) as d;

-- -----------------------------------------------------------------------------
-- Topics (fictitious): member 1 → 3, member 2 → 5, member 3 → 2, member 4 → 1, member 5 → 0
-- -----------------------------------------------------------------------------

insert into public.topics (meeting_id, member_id, priority, tag, title, details)
values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 1, 'DECISION',
   '[Démo] Choisir le prestataire de ménage des parties communes', 'Deux devis fictifs à comparer.'),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 2, 'INFO',
   '[Démo] Nouveau logiciel de gestion locative', null),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 3, 'EXCHANGE',
   '[Démo] Organisation des astreintes de décembre', null),

  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 1, 'ALERT',
   '[Démo] Dégât des eaux à la résidence des Tilleuls', 'Sinistre fictif, déclaration à faire avant vendredi.'),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 2, 'DECISION',
   '[Démo] Budget travaux 2027', null),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 3, 'EXCHANGE',
   '[Démo] Retour des locataires sur la nouvelle chaudière', null),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 4, 'INFO',
   '[Démo] Fermeture de l''agence le 24 décembre', null),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000002', 5, 'INFO',
   '[Démo] Formation sécurité incendie', null),

  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000003', 1, 'EXCHANGE',
   '[Démo] Relances des loyers impayés', null),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000003', 2, 'ALERT',
   '[Démo] Ascenseur en panne rue Pasteur', 'Immeuble fictif.'),

  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000004', 1, 'INFO',
   '[Démo] Mise à jour des diagnostics énergétiques', null);

-- -----------------------------------------------------------------------------
-- Visits and trips (fictitious), within the meeting week
-- -----------------------------------------------------------------------------

insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
select
  m.id,
  v.member_id::uuid,
  m.meeting_date + v.day_offset,
  v.place,
  v.purpose
from public.meetings m
cross join (
  values
    ('00000000-0000-4000-b000-000000000001', 1, '[Démo] Lyon, résidence Les Tilleuls', 'État des lieux de sortie'),
    ('00000000-0000-4000-b000-000000000002', 2, '[Démo] Villeurbanne, immeuble Pasteur', 'Rendez-vous avec l''ascensoriste'),
    ('00000000-0000-4000-b000-000000000003', 3, '[Démo] Annecy', 'Assemblée générale de copropriété'),
    ('00000000-0000-4000-b000-000000000003', 4, '[Démo] Chambéry', 'Visite d''un appartement à louer'),
    ('00000000-0000-4000-b000-000000000005', 2, '[Démo] Grenoble', 'Salon de l''immobilier')
) as v (member_id, day_offset, place, purpose)
where m.id = '00000000-0000-4000-c000-000000000001';
