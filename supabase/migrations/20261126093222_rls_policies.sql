-- Good Morning Property — access rules: helper functions, table privileges, RLS policies.
-- Default deny: privileges are revoked from the API roles, then granted table by table
-- (and column by column for writes); every read and write is then filtered by RLS.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer: they read members/meetings without RLS recursion)
-- ---------------------------------------------------------------------------

create function private.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.members m
  where m.user_id = auth.uid()
    and m.is_active
$$;
comment on function private.current_member_id() is
  'Id of the ACTIVE member linked to auth.uid(), or null (anonymous, unknown or inactive).';

create function private.is_facilitator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select m.is_facilitator from public.members m where m.user_id = auth.uid() and m.is_active),
    false
  )
$$;
comment on function private.is_facilitator() is
  'True if the current user is an active member with the animateur role.';

create function private.is_lead()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select m.is_lead from public.members m where m.user_id = auth.uid() and m.is_active),
    false
  )
$$;
comment on function private.is_lead() is
  'True if the current user is the active member with the responsable role.';

create function private.is_entry_open(meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select now() < m.entry_deadline from public.meetings m where m.id = is_entry_open.meeting_id),
    false
  )
$$;
comment on function private.is_entry_open(uuid) is
  'True while the entry window of the meeting is open (now() < entry_deadline). False for an unknown meeting.';

create function private.is_meeting_closed(meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select now() >= m.entry_deadline from public.meetings m where m.id = is_meeting_closed.meeting_id),
    false
  )
$$;
comment on function private.is_meeting_closed(uuid) is
  'True once the entry deadline of the meeting has passed (inverse of is_entry_open). False for an unknown meeting.';

revoke all on function private.current_member_id() from public;
revoke all on function private.is_facilitator() from public;
revoke all on function private.is_lead() from public;
revoke all on function private.is_entry_open(uuid) from public;
revoke all on function private.is_meeting_closed(uuid) from public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.current_member_id() to authenticated, service_role;
grant execute on function private.is_facilitator() to authenticated, service_role;
grant execute on function private.is_lead() to authenticated, service_role;
grant execute on function private.is_entry_open(uuid) to authenticated, service_role;
grant execute on function private.is_meeting_closed(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Table privileges: nothing for anon; minimal, column-level writes for authenticated.
-- ---------------------------------------------------------------------------

revoke all on table public.members, public.meetings, public.topics, public.visits
  from anon, authenticated;

-- members: read; facilitators insert/update profile and role columns.
-- user_id is not writable through the API (linked server-side at first sign-in).
grant select on table public.members to authenticated;
grant insert (email, display_name, initials, avatar_color, is_facilitator, is_lead, is_active)
  on table public.members to authenticated;
grant update (email, display_name, initials, avatar_color, is_facilitator, is_lead, is_active)
  on table public.members to authenticated;

-- meetings: read only (created by the server with the admin client).
grant select on table public.meetings to authenticated;

-- topics, visits: meeting_id and member_id are set on insert and can never change.
grant select, delete on table public.topics to authenticated;
grant insert (meeting_id, member_id, title, details, priority, tag)
  on table public.topics to authenticated;
grant update (title, details, priority, tag) on table public.topics to authenticated;

grant select, delete on table public.visits to authenticated;
grant insert (meeting_id, member_id, visit_date, place, purpose)
  on table public.visits to authenticated;
grant update (visit_date, place, purpose) on table public.visits to authenticated;

grant all on table public.members, public.meetings, public.topics, public.visits to service_role;

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------

create policy members_select_active on public.members
  for select to authenticated
  using ((select private.current_member_id()) is not null);
comment on policy members_select_active on public.members is
  'Any active member reads the team (names and avatar badges).';

create policy members_insert_facilitator on public.members
  for insert to authenticated
  with check ((select private.is_facilitator()));
comment on policy members_insert_facilitator on public.members is
  'Only facilitators add members.';

create policy members_update_facilitator on public.members
  for update to authenticated
  using ((select private.is_facilitator()))
  with check ((select private.is_facilitator()));
comment on policy members_update_facilitator on public.members is
  'Only facilitators edit members (no delete: deactivate instead).';

-- ---------------------------------------------------------------------------
-- meetings
-- ---------------------------------------------------------------------------

create policy meetings_select_active on public.meetings
  for select to authenticated
  using ((select private.current_member_id()) is not null);
comment on policy meetings_select_active on public.meetings is
  'Any active member reads meetings. No write policy: meetings are created server-side.';

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------

create policy topics_select on public.topics
  for select to authenticated
  using (
    member_id = (select private.current_member_id())
    or (select private.is_lead())
    or ((select private.is_facilitator()) and private.is_meeting_closed(meeting_id))
  );
comment on policy topics_select on public.topics is
  'Own topics; all topics for the lead; all topics for facilitators once the entry deadline has passed.';

create policy topics_insert_own_open on public.topics
  for insert to authenticated
  with check (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy topics_insert_own_open on public.topics is
  'A member creates their own topics, before the entry deadline.';

create policy topics_update_own_open on public.topics
  for update to authenticated
  using (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  )
  with check (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy topics_update_own_open on public.topics is
  'A member edits their own topics, before the entry deadline (meeting_id and member_id are not updatable).';

create policy topics_delete_own_open on public.topics
  for delete to authenticated
  using (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy topics_delete_own_open on public.topics is
  'A member deletes their own topics, before the entry deadline.';

-- ---------------------------------------------------------------------------
-- visits
-- ---------------------------------------------------------------------------

create policy visits_select on public.visits
  for select to authenticated
  using (
    member_id = (select private.current_member_id())
    or (select private.is_lead())
    or ((select private.is_facilitator()) and private.is_meeting_closed(meeting_id))
  );
comment on policy visits_select on public.visits is
  'Own visits; all visits for the lead; all visits for facilitators once the entry deadline has passed.';

create policy visits_insert_own_open on public.visits
  for insert to authenticated
  with check (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy visits_insert_own_open on public.visits is
  'A member creates their own visits, before the entry deadline.';

create policy visits_update_own_open on public.visits
  for update to authenticated
  using (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  )
  with check (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy visits_update_own_open on public.visits is
  'A member edits their own visits, before the entry deadline (meeting_id and member_id are not updatable).';

create policy visits_delete_own_open on public.visits
  for delete to authenticated
  using (
    member_id = (select private.current_member_id())
    and private.is_entry_open(meeting_id)
  );
comment on policy visits_delete_own_open on public.visits is
  'A member deletes their own visits, before the entry deadline.';
