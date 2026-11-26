-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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

-- reorder_topics: full reorder in one transaction, own topics only, before the deadline.

insert into public.topics (id, meeting_id, member_id, title, priority, tag) values
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'A deux', 2, 'EXCHANGE'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'A trois', 3, 'DECISION');

set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[
      'c0000000-0000-4000-8000-000000000012',
      'c0000000-0000-4000-8000-000000000001',
      'c0000000-0000-4000-8000-000000000011'
    ]::uuid[])$$,
  'a member reorders all their topics'
);
select lives_ok('set constraints all immediate', 'the new priorities satisfy the unique constraint');
select results_eq(
  $$select title from public.topics
    where meeting_id = 'b0000000-0000-4000-8000-000000000001'
      and member_id = 'a0000000-0000-4000-8000-000000000011'
    order by priority$$,
  array['A trois', 'A open', 'A deux'],
  'priorities follow the given order (1..n)'
);
set constraints all deferred;

select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[
      'c0000000-0000-4000-8000-000000000012',
      'c0000000-0000-4000-8000-000000000001'
    ]::uuid[])$$,
  'P0001', 'Le nouvel ordre ne correspond pas à tes sujets : recharge la page.',
  'an incomplete order is refused'
);
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[
      'c0000000-0000-4000-8000-000000000012',
      'c0000000-0000-4000-8000-000000000012',
      'c0000000-0000-4000-8000-000000000011'
    ]::uuid[])$$,
  'P0001', null, 'a duplicated id is refused'
);
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[
      'c0000000-0000-4000-8000-000000000012',
      'c0000000-0000-4000-8000-000000000003',
      'c0000000-0000-4000-8000-000000000011'
    ]::uuid[])$$,
  'P0001', null, 'an id belonging to another member is refused'
);
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000002', array[
      'c0000000-0000-4000-8000-000000000002'
    ]::uuid[])$$,
  'P0001', 'La saisie est fermée pour cette réunion.',
  'reordering is refused after the deadline'
);

-- Another member cannot touch A's topics, even with A's ids.
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[
      'c0000000-0000-4000-8000-000000000001',
      'c0000000-0000-4000-8000-000000000011',
      'c0000000-0000-4000-8000-000000000012'
    ]::uuid[])$$,
  'P0001', null, 'another member''s ids are refused'
);

-- Inactive member
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[]::uuid[])$$,
  '42501', null, 'an inactive member cannot reorder'
);

reset role;
set local role anon;
select throws_ok(
  $$select public.reorder_topics('b0000000-0000-4000-8000-000000000001', array[]::uuid[])$$,
  '42501', null, 'anonymous users cannot call reorder_topics'
);
reset role;

select results_eq(
  $$select title from public.topics
    where meeting_id = 'b0000000-0000-4000-8000-000000000001'
      and member_id = 'a0000000-0000-4000-8000-000000000011'
    order by priority$$,
  array['A trois', 'A open', 'A deux'],
  'refused calls changed nothing'
);

select * from finish();

rollback;
