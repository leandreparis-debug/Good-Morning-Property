-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

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

-- Visibility and write rules on topics and visits.

-- Member A ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select results_eq(
  'select title from public.topics order by title',
  array['A closed', 'A open'],
  'a member reads their own topics only'
);
select is_empty(
  $$select 1 from public.topics where member_id = 'a0000000-0000-4000-8000-000000000012'$$,
  'a member does not read another member''s topics'
);
select is(
  (select count(*)::int from public.visits),
  2,
  'a member reads their own visits only'
);

select lives_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'Nouveau', 2, 'DECISION')$$,
  'a member creates a topic before the deadline'
);
select lives_ok(
  $$update public.topics set title = 'A open modifié' where id = 'c0000000-0000-4000-8000-000000000001'$$,
  'a member edits a topic before the deadline'
);
select lives_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', '2099-01-08', 'Lieu', 'Objet')$$,
  'a member creates a visit before the deadline'
);

select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000011', 'Trop tard', 2, 'INFO')$$,
  'P0001',
  'La saisie est fermée pour cette réunion.',
  'a member cannot create a topic after the deadline'
);
select throws_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000011', '2020-01-09', 'Lieu', 'Objet')$$,
  'P0001',
  'La saisie est fermée pour cette réunion.',
  'a member cannot create a visit after the deadline'
);
select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'Pour B', 3, 'INFO')$$,
  '42501', null,
  'a member cannot create a topic for another member'
);
select throws_ok(
  $$update public.topics set member_id = 'a0000000-0000-4000-8000-000000000012' where id = 'c0000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  'member_id of a topic cannot change'
);
select throws_ok(
  $$update public.topics set meeting_id = 'b0000000-0000-4000-8000-000000000002' where id = 'c0000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  'meeting_id of a topic cannot change'
);

-- Silent no-ops (rows filtered out by RLS), checked below as postgres.
update public.topics set title = 'piraté' where id = 'c0000000-0000-4000-8000-000000000002';
delete from public.topics where id = 'c0000000-0000-4000-8000-000000000002';
update public.visits set place = 'piraté' where id = 'd0000000-0000-4000-8000-000000000002';
delete from public.visits where id = 'd0000000-0000-4000-8000-000000000002';
update public.topics set title = 'piraté' where id = 'c0000000-0000-4000-8000-000000000003';
delete from public.topics where id = 'c0000000-0000-4000-8000-000000000003';
delete from public.visits where id = 'd0000000-0000-4000-8000-000000000003';

reset role;

select is(
  (select title from public.topics where id = 'c0000000-0000-4000-8000-000000000002'),
  'A closed',
  'a member cannot edit or delete their topic after the deadline'
);
select is(
  (select place from public.visits where id = 'd0000000-0000-4000-8000-000000000002'),
  'Lieu A',
  'a member cannot edit or delete their visit after the deadline'
);
select is(
  (select title from public.topics where id = 'c0000000-0000-4000-8000-000000000003'),
  'B open',
  'a member cannot edit or delete another member''s topic'
);
select isnt_empty(
  $$select 1 from public.visits where id = 'd0000000-0000-4000-8000-000000000003'$$,
  'a member cannot delete another member''s visit'
);

-- Lead --------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select is(
  (select count(*)::int from public.topics where meeting_id = 'b0000000-0000-4000-8000-000000000001'),
  3,
  'the lead reads everyone''s topics before the deadline'
);
select is(
  (select count(*)::int from public.visits where meeting_id = 'b0000000-0000-4000-8000-000000000001'),
  3,
  'the lead reads everyone''s visits before the deadline'
);
select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'Pour A', 4, 'INFO')$$,
  '42501', null,
  'the lead cannot write for another member'
);

-- Facilitator (not lead) ----------------------------------------------------------------
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select is_empty(
  $$select 1 from public.topics where meeting_id = 'b0000000-0000-4000-8000-000000000001'$$,
  'a facilitator does not read others'' topics before the deadline'
);
select is_empty(
  $$select 1 from public.visits where meeting_id = 'b0000000-0000-4000-8000-000000000001'$$,
  'a facilitator does not read others'' visits before the deadline'
);
select is(
  (select count(*)::int from public.topics where meeting_id = 'b0000000-0000-4000-8000-000000000002'),
  2,
  'a facilitator reads everyone''s topics after the deadline'
);
select is(
  (select count(*)::int from public.visits where meeting_id = 'b0000000-0000-4000-8000-000000000002'),
  2,
  'a facilitator reads everyone''s visits after the deadline'
);

-- Inactive member -------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select is_empty('select 1 from public.members', 'an inactive member reads no member');
select is_empty('select 1 from public.meetings', 'an inactive member reads no meeting');
select is_empty('select 1 from public.topics', 'an inactive member reads no topic');
select is_empty('select 1 from public.visits', 'an inactive member reads no visit');
select throws_ok(
  $$insert into public.topics (meeting_id, member_id, title, priority, tag)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000015', 'Inactif', 1, 'INFO')$$,
  '42501', null,
  'an inactive member cannot create a topic'
);
select throws_ok(
  $$insert into public.visits (meeting_id, member_id, visit_date, place, purpose)
    values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000015', '2099-01-06', 'Lieu', 'Objet')$$,
  '42501', null,
  'an inactive member cannot create a visit'
);

-- Signed-in user without a member profile -----------------------------------------------------
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select is_empty('select 1 from public.topics', 'a user without a member profile reads no topic');
select is_empty('select 1 from public.members', 'a user without a member profile reads no member');

-- Anonymous ----------------------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok('select * from public.members', '42501', null, 'anonymous users cannot read members');
select throws_ok('select * from public.meetings', '42501', null, 'anonymous users cannot read meetings');
select throws_ok('select * from public.topics', '42501', null, 'anonymous users cannot read topics');
select throws_ok('select * from public.visits', '42501', null, 'anonymous users cannot read visits');

reset role;

select * from finish();

rollback;
