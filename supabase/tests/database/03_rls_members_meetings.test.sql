-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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

-- Access rules on members and meetings.

-- Plain member -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is((select count(*)::int from public.members), 5, 'an active member reads the whole team');
select is((select count(*)::int from public.meetings), 2, 'an active member reads meetings');

select throws_ok(
  $$insert into public.members (email, display_name, initials, avatar_color) values ('new@example.test', 'Nouveau', 'N', 'sun')$$,
  '42501', null, 'a plain member cannot add a member'
);

update public.members set display_name = 'Piraté' where id = 'a0000000-0000-4000-8000-000000000012';
update public.members set is_facilitator = true where id = 'a0000000-0000-4000-8000-000000000011';

select throws_ok(
  $$insert into public.meetings (meeting_date, entry_deadline) values ('2099-01-12', '2099-01-12 09:00:00+00')$$,
  '42501', null, 'a member cannot create a meeting'
);
select throws_ok(
  $$delete from public.members where id = 'a0000000-0000-4000-8000-000000000012'$$,
  '42501', null, 'nobody can delete a member through the API'
);

reset role;
select is(
  (select display_name from public.members where id = 'a0000000-0000-4000-8000-000000000012'),
  'Test B',
  'a plain member cannot edit another member'
);
select is(
  (select is_facilitator from public.members where id = 'a0000000-0000-4000-8000-000000000011'),
  false,
  'a plain member cannot grant themselves a role'
);

-- Facilitator -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select lives_ok(
  $$insert into public.members (email, display_name, initials, avatar_color) values ('new@example.test', 'Nouveau', 'N', 'sun')$$,
  'a facilitator adds a member'
);
select lives_ok(
  $$update public.members set display_name = 'Test B renommé', is_active = false where id = 'a0000000-0000-4000-8000-000000000012'$$,
  'a facilitator edits and deactivates a member'
);
select throws_ok(
  $$update public.members set user_id = 'a0000000-0000-4000-8000-000000000006' where id = 'a0000000-0000-4000-8000-000000000012'$$,
  '42501', null, 'user_id cannot be changed through the API'
);
select throws_ok(
  $$update public.members set is_lead = true where id = 'a0000000-0000-4000-8000-000000000011'$$,
  '23505', null, 'a facilitator cannot appoint a second lead'
);
select throws_ok(
  $$update public.members set is_facilitator = false where id = 'a0000000-0000-4000-8000-000000000014'$$,
  'P0001',
  'Il doit rester au moins un animateur actif : désignez-en un autre avant de retirer ce rôle.',
  'the last facilitator cannot remove their own role'
);
select throws_ok(
  $$update public.meetings set entry_deadline = now() where id = 'b0000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'a facilitator cannot change a meeting deadline'
);

reset role;

select * from finish();

rollback;
