-- pgTAP — run with `pnpm test:db` (supabase test db) on the LOCAL database.
-- Schema-level security checks. Read-only, rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

select tables_are(
  'public',
  array['members', 'meetings', 'topics', 'visits'],
  'public holds exactly the 4 app tables'
);

select is_empty(
  $$select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity$$,
  'RLS is enabled on every table in public'
);

select ok(
  not has_table_privilege('anon', 'public.members', 'select')
  and not has_table_privilege('anon', 'public.meetings', 'select')
  and not has_table_privilege('anon', 'public.topics', 'select')
  and not has_table_privilege('anon', 'public.visits', 'select'),
  'anon has no SELECT privilege on app tables'
);

select ok(
  not has_column_privilege('authenticated', 'public.members', 'user_id', 'update')
  and not has_column_privilege('authenticated', 'public.members', 'user_id', 'insert'),
  'authenticated cannot write members.user_id'
);

select ok(
  not has_column_privilege('authenticated', 'public.topics', 'member_id', 'update')
  and not has_column_privilege('authenticated', 'public.topics', 'meeting_id', 'update')
  and not has_column_privilege('authenticated', 'public.visits', 'member_id', 'update')
  and not has_column_privilege('authenticated', 'public.visits', 'meeting_id', 'update'),
  'meeting_id and member_id of topics and visits are not updatable'
);

select is_empty(
  $$select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.prosecdef
      and not coalesce(p.proconfig @> array['search_path=""'], false)$$,
  'every security definer helper pins an empty search_path'
);

select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot use the private schema'
);

select * from finish();

rollback;
