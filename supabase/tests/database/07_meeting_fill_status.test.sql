-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

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

-- meeting_fill_status: counts only, for active members.

insert into public.topics (meeting_id, member_id, title, priority, tag) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'A alerte', 2, 'ALERT'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'B alerte', 2, 'ALERT'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'B trois', 3, 'INFO');

set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select results_eq(
  $$select member_id, topics_count, visits_count, alerts_count
    from public.meeting_fill_status('b0000000-0000-4000-8000-000000000001')
    order by member_id$$,
  $$values
    ('a0000000-0000-4000-8000-000000000011'::uuid, 2, 1, 1),
    ('a0000000-0000-4000-8000-000000000012'::uuid, 3, 1, 1),
    ('a0000000-0000-4000-8000-000000000013'::uuid, 0, 0, 0),
    ('a0000000-0000-4000-8000-000000000014'::uuid, 0, 0, 0)$$,
  'a plain member sees the counts of every active member (inactive ones excluded)'
);

select is_empty(
  $$select 1 from public.topics where member_id = 'a0000000-0000-4000-8000-000000000012'$$,
  'yet the same member still cannot read the other topics'
);

select is(
  (select proargnames::text from pg_proc where proname = 'meeting_fill_status'),
  '{meeting_id,member_id,topics_count,visits_count,alerts_count}',
  'only counts are returned: no title, details, place or purpose'
);

select is_empty(
  $$select 1 from public.meeting_fill_status('b0000000-0000-4000-8000-0000000000ff')
    where topics_count > 0 or visits_count > 0$$,
  'an unknown meeting gives zero counts'
);

-- Inactive member
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$select * from public.meeting_fill_status('b0000000-0000-4000-8000-000000000001')$$,
  '42501', 'Réservé aux membres actifs.', 'an inactive member is refused'
);

-- Signed in without a member profile
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok(
  $$select * from public.meeting_fill_status('b0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'a user without a member profile is refused'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.meeting_fill_status('b0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'anonymous users cannot call meeting_fill_status'
);
reset role;

select * from finish();

rollback;
