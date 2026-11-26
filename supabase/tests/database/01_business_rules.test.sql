-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- ---------------------------------------------------------------------------
-- Fixtures (FICTITIOUS), created as postgres and rolled back at the end.
--   A, B : plain members          L : lead (responsable)
--   F    : facilitator (animateur), not lead     I : inactive member
--   meeting "open"   : 2099-01-05, entry deadline in the future
--   meeting "closed" : 2020-01-06, entry deadline in the past
-- ---------------------------------------------------------------------------
delete from public.visits;
delete from public.topics;
delete from public.meetings;
delete from public.members;

insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'test-a@example.test'),
  ('a0000000-0000-4000-8000-000000000002', 'test-b@example.test'),
  ('a0000000-0000-4000-8000-000000000003', 'test-lead@example.test'),
  ('a0000000-0000-4000-8000-000000000004', 'test-facilitator@example.test'),
  ('a0000000-0000-4000-8000-000000000005', 'test-inactive@example.test'),
  ('a0000000-0000-4000-8000-000000000006', 'test-stranger@example.test');

insert into public.members (id, user_id, email, display_name, initials, avatar_color, is_facilitator, is_lead, is_active) values
  ('a0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'test-a@example.test', 'Test A', 'TA', 'sun', false, false, true),
  ('a0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'test-b@example.test', 'Test B', 'TB', 'grass', false, false, true),
  ('a0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'test-lead@example.test', 'Test Lead', 'TL', 'sky', false, true, true),
  ('a0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', 'test-facilitator@example.test', 'Test Facilitator', 'TF', 'card', true, false, true),
  ('a0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000005', 'test-inactive@example.test', 'Test Inactive', 'TI', 'ink', false, false, false);

insert into public.meetings (id, meeting_date, entry_deadline) values
  ('b0000000-0000-4000-8000-000000000001', '2099-01-05', '2099-01-05 09:00:00+00'),
  ('b0000000-0000-4000-8000-000000000002', '2020-01-06', '2020-01-06 09:00:00+00');

insert into public.topics (id, meeting_id, member_id, title, priority, tag) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'A open', 1, 'INFO'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000011', 'A closed', 1, 'ALERT'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'B open', 1, 'EXCHANGE'),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000012', 'B closed', 1, 'DECISION');

insert into public.visits (id, meeting_id, member_id, visit_date, place, purpose) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', '2099-01-06', 'Lieu A', 'Objet A'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000011', '2020-01-07', 'Lieu A', 'Objet A'),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-07', 'Lieu B', 'Objet B'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000012', '2020-01-08', 'Lieu B', 'Objet B');

-- Business rules enforced by constraints and triggers.

-- 6th topic --------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    select 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'Sujet ' || p, p, 'INFO'
    from generate_series(2, 5) as p$$,
  'a member can have 5 topics for a meeting'
);

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'Sixième', 5, 'INFO')$$,
  'P0001',
  'Un membre ne peut pas avoir plus de 5 sujets pour une même réunion.',
  'the 6th topic is refused'
);

-- Unique priority ------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
set constraints all immediate;

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'Doublon', 1, 'INFO')$$,
  '23505',
  null,
  'two topics with the same priority are refused'
);

select lives_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'B second', 2, 'INFO')$$,
  'a second topic with another priority is accepted'
);

set constraints all deferred;
update public.topics set priority = 2 where id = 'c0000000-0000-4000-8000-000000000003';
update public.topics set priority = 1 where title = 'B second';

select lives_ok('set constraints all immediate', 'swapping two priorities in one transaction is accepted');

select results_eq(
  $$select title from public.topics where member_id = 'a0000000-0000-4000-8000-000000000012'
    and meeting_id = 'b0000000-0000-4000-8000-000000000001' order by priority$$,
  array['B second', 'B open'],
  'priorities are swapped'
);

-- Text checks ----------------------------------------------------------------------
select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '   ', 3, 'INFO')$$,
  '23514', null, 'a blank title is refused'
);

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', repeat('x', 121), 3, 'INFO')$$,
  '23514', null, 'a title over 120 characters is refused'
);

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, details, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'Titre', repeat('x', 281), 3, 'INFO')$$,
  '23514', null, 'details over 280 characters are refused'
);

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'Titre', 6, 'INFO')$$,
  '23514', null, 'a priority outside 1–5 is refused'
);

-- Visits within the meeting week ---------------------------------------------------
select throws_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-12', 'Lieu', 'Objet')$$,
  'P0001',
  'La date de la visite doit être comprise entre le lundi 05/01/2099 et le dimanche 11/01/2099.',
  'a visit after the meeting week is refused'
);

select throws_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-04', 'Lieu', 'Objet')$$,
  'P0001', null, 'a visit before the meeting week is refused'
);

select lives_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-05', 'Lieu', 'Lundi'),
           ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-11', 'Lieu', 'Dimanche')$$,
  'visits on Monday and Sunday of the meeting week are accepted'
);

select throws_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', '2099-01-06', repeat('x', 121), 'Objet')$$,
  '23514', null, 'a place over 120 characters is refused'
);

reset role;

-- Meetings and members -------------------------------------------------------------
select throws_ok(
  $$insert into public.meetings (meeting_date, entry_deadline) values ('2099-01-06', now())$$,
  '23514', null, 'a meeting that is not on a Monday is refused'
);

select throws_ok(
  $$update public.members set is_lead = true where id = 'a0000000-0000-4000-8000-000000000011'$$,
  '23505', null, 'a second lead is refused'
);

select throws_ok(
  $$update public.members set is_facilitator = false where id = 'a0000000-0000-4000-8000-000000000014'$$,
  'P0001',
  'Il doit rester au moins un animateur actif : désignez-en un autre avant de retirer ce rôle.',
  'the last facilitator cannot lose the role'
);

select throws_ok(
  $$update public.members set is_active = false where id = 'a0000000-0000-4000-8000-000000000014'$$,
  'P0001', null, 'the last facilitator cannot be deactivated'
);

update public.members set is_facilitator = true where id = 'a0000000-0000-4000-8000-000000000011';

select lives_ok(
  $$update public.members set is_facilitator = false where id = 'a0000000-0000-4000-8000-000000000014'$$,
  'a facilitator can lose the role when another active facilitator exists'
);

select throws_ok(
  $$insert into public.members (email, display_name, initials, avatar_color) values ('x@example.test', 'X', 'ab', 'sun')$$,
  '23514', null, 'lowercase initials are refused'
);

select throws_ok(
  $$insert into public.members (email, display_name, initials, avatar_color) values ('x@example.test', 'X', 'X', 'red')$$,
  '23514', null, 'an unknown avatar colour is refused'
);

select throws_ok(
  $$insert into public.members (email, display_name, initials, avatar_color) values ('TEST-A@example.test', 'X', 'X', 'sun')$$,
  '23505', null, 'emails are unique regardless of case'
);

select * from finish();

rollback;
