-- Good Morning Property — business rules enforced by triggers.
-- Every rule raises SQLSTATE P0001 with a French message and a machine-readable HINT
-- (topics_max_five, entry_closed, visit_outside_meeting_week, last_facilitator),
-- translated by src/server/errors.ts.

-- ---------------------------------------------------------------------------
-- topics: 5 at most per member and meeting
-- ---------------------------------------------------------------------------

create function private.topics_max_five()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  topic_count integer;
begin
  -- Serialise concurrent inserts for the same member and meeting.
  perform pg_advisory_xact_lock(
    hashtextextended('topics:' || new.meeting_id::text || ':' || new.member_id::text, 0)
  );

  select count(*) into topic_count
  from public.topics t
  where t.meeting_id = new.meeting_id
    and t.member_id = new.member_id
    and t.id <> new.id;

  if topic_count >= 5 then
    raise exception 'Un membre ne peut pas avoir plus de 5 sujets pour une même réunion.'
      using errcode = 'P0001', hint = 'topics_max_five';
  end if;

  return new;
end;
$$;
comment on function private.topics_max_five() is
  'BEFORE INSERT/UPDATE trigger on topics: refuses a 6th topic for the same member and meeting (P0001, hint topics_max_five).';

create trigger topics_max_five
  before insert or update of meeting_id, member_id on public.topics
  for each row execute function private.topics_max_five();

-- ---------------------------------------------------------------------------
-- topics, visits: explicit error when the entry window is closed
-- (RLS refuses the write anyway; this trigger only gives a readable message.)
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER on purpose: current_user must be the calling API role.
create function private.ensure_entry_open()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deadline timestamptz;
begin
  -- Server-side jobs (service_role, postgres) are not bound by the entry window.
  -- An inactive member reads no meeting (RLS): deadline stays null and RLS refuses the write.
  if current_user::text not in ('authenticated', 'anon') then
    return new;
  end if;

  select m.entry_deadline into deadline
  from public.meetings m
  where m.id = new.meeting_id;

  if deadline is not null and now() >= deadline then
    raise exception 'La saisie est fermée pour cette réunion.'
      using errcode = 'P0001', hint = 'entry_closed';
  end if;

  return new;
end;
$$;
comment on function private.ensure_entry_open() is
  'BEFORE INSERT/UPDATE trigger on topics and visits: for API users, refuses writes once the meeting entry deadline has passed (P0001, hint entry_closed).';

create trigger topics_entry_open
  before insert or update on public.topics
  for each row execute function private.ensure_entry_open();

create trigger visits_entry_open
  before insert or update on public.visits
  for each row execute function private.ensure_entry_open();

-- ---------------------------------------------------------------------------
-- visits: date within the meeting week (Monday to Sunday)
-- ---------------------------------------------------------------------------

create function private.visits_in_meeting_week()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  monday date;
begin
  select m.meeting_date into monday
  from public.meetings m
  where m.id = new.meeting_id;

  if monday is not null and (new.visit_date < monday or new.visit_date > monday + 6) then
    raise exception 'La date de la visite doit être comprise entre le lundi % et le dimanche %.',
      to_char(monday, 'DD/MM/YYYY'), to_char(monday + 6, 'DD/MM/YYYY')
      using errcode = 'P0001', hint = 'visit_outside_meeting_week';
  end if;

  return new;
end;
$$;
comment on function private.visits_in_meeting_week() is
  'BEFORE INSERT/UPDATE trigger on visits: refuses a visit_date outside Monday–Sunday of the meeting week (P0001, hint visit_outside_meeting_week).';

create trigger visits_in_meeting_week
  before insert or update of visit_date, meeting_id on public.visits
  for each row execute function private.visits_in_meeting_week();

-- ---------------------------------------------------------------------------
-- members: always keep at least one active facilitator
-- ---------------------------------------------------------------------------

create function private.keep_one_facilitator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_facilitator and old.is_active
     and not (new.is_facilitator and new.is_active) then
    perform pg_advisory_xact_lock(hashtextextended('members:facilitators', 0));

    if not exists (
      select 1
      from public.members m
      where m.id <> old.id
        and m.is_facilitator
        and m.is_active
    ) then
      raise exception 'Il doit rester au moins un animateur actif : désignez-en un autre avant de retirer ce rôle.'
        using errcode = 'P0001', hint = 'last_facilitator';
    end if;
  end if;

  return new;
end;
$$;
comment on function private.keep_one_facilitator() is
  'BEFORE UPDATE trigger on members: refuses removing the facilitator role from, or deactivating, the last active facilitator (P0001, hint last_facilitator).';

create trigger members_keep_one_facilitator
  before update of is_facilitator, is_active on public.members
  for each row execute function private.keep_one_facilitator();

revoke all on function private.topics_max_five() from public;
revoke all on function private.ensure_entry_open() from public;
revoke all on function private.visits_in_meeting_week() from public;
revoke all on function private.keep_one_facilitator() from public;
