-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Everything runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;
create extension if not exists pgcrypto with schema extensions;

select plan(16);

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

-- Personal access links: token columns hidden from API users; set_lead.

update public.members
set access_token_hash = encode(extensions.digest('jeton-fictif-a', 'sha256'), 'hex'),
    access_token_created_at = now()
where id = 'a0000000-0000-4000-8000-000000000011';

select throws_ok(
  $$update public.members set access_token_hash = 'not-a-hash', access_token_created_at = now()
    where id = 'a0000000-0000-4000-8000-000000000012'$$,
  '23514', null, 'only a hex SHA-256 can be stored as a token hash'
);
select throws_ok(
  $$update public.members set access_token_hash = repeat('a', 64)
    where id = 'a0000000-0000-4000-8000-000000000012'$$,
  '23514', null, 'a token hash always comes with its creation time'
);

select ok(
  not has_column_privilege('authenticated', 'public.members', 'access_token_hash', 'select')
  and not has_column_privilege('authenticated', 'public.members', 'access_token_created_at', 'select'),
  'authenticated cannot read the token columns'
);
select ok(
  not has_column_privilege('authenticated', 'public.members', 'access_token_hash', 'update')
  and not has_column_privilege('authenticated', 'public.members', 'access_token_hash', 'insert')
  and not has_column_privilege('authenticated', 'public.members', 'access_token_created_at', 'update'),
  'authenticated cannot write the token columns'
);

-- As a facilitator ----------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  'select access_token_hash from public.members',
  '42501', null, 'even a facilitator cannot read token hashes'
);
select throws_ok(
  'select * from public.members',
  '42501', null, 'select * on members is refused (token columns are not readable)'
);
select lives_ok(
  'select id, display_name, initials, avatar_color, is_facilitator, is_lead, is_active from public.members',
  'the other member columns stay readable'
);
select throws_ok(
  $$update public.members set access_token_hash = null, access_token_created_at = null
    where id = 'a0000000-0000-4000-8000-000000000011'$$,
  '42501', null, 'even a facilitator cannot revoke a link through the API'
);

select lives_ok(
  $$select public.set_lead('a0000000-0000-4000-8000-000000000012')$$,
  'a facilitator moves the lead role'
);
select results_eq(
  'select id from public.members where is_lead',
  $$values ('a0000000-0000-4000-8000-000000000012'::uuid)$$,
  'the previous lead lost the role in the same transaction'
);
select throws_ok(
  $$select public.set_lead('a0000000-0000-4000-8000-000000000015')$$,
  'P0001', 'Ce membre est introuvable ou désactivé.',
  'an inactive member cannot become lead'
);
select lives_ok($$select public.set_lead(null)$$, 'a facilitator can leave the lead role empty');
select is_empty('select 1 from public.members where is_lead', 'nobody is lead any more');

-- As a plain member -------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$select public.set_lead('a0000000-0000-4000-8000-000000000011')$$,
  '42501', 'Seul un animateur peut désigner le responsable.',
  'a plain member cannot appoint the lead'
);

-- Anonymous ----------------------------------------------------------------------------------
reset role;
set local role anon;
select throws_ok(
  $$select public.set_lead(null)$$,
  '42501', null, 'anonymous users cannot call set_lead'
);
reset role;

select is(
  (select access_token_hash from public.members where id = 'a0000000-0000-4000-8000-000000000011'),
  encode(extensions.digest('jeton-fictif-a', 'sha256'), 'hex'),
  'the stored hash is untouched'
);

select * from finish();

rollback;
