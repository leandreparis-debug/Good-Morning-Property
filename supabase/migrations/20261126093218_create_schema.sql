-- Good Morning Property — schema: members, meetings, topics, visits.
-- RLS is enabled on every table here; with no policy yet, the API roles see nothing.
-- Policies come in the rls_policies migration, business triggers in business_rules.

create extension if not exists citext with schema extensions;

-- Server-side helpers (security definer functions, trigger functions).
-- Not exposed through the API (PostgREST only serves `public`).
create schema if not exists private;
comment on schema private is
  'Internal helpers used by RLS policies and triggers. Not exposed through the Data API.';
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.topic_tag as enum ('INFO', 'EXCHANGE', 'DECISION', 'ALERT');
comment on type public.topic_tag is
  'Topic tag: INFO = Pour info, EXCHANGE = Pour échange, DECISION = Pour décision, ALERT = Pour alerte.';

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
comment on function private.set_updated_at() is
  'Generic BEFORE UPDATE trigger: sets updated_at to now().';

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------

create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  email extensions.citext not null unique,
  display_name text not null,
  initials text not null,
  avatar_color text not null,
  is_facilitator boolean not null default false,
  is_lead boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint members_display_name_length
    check (char_length(btrim(display_name)) >= 1 and char_length(display_name) <= 60),
  constraint members_initials_format
    check (
      char_length(initials) between 1 and 3
      and initials = upper(initials)
      and initials !~ '[[:space:]]'
    ),
  constraint members_avatar_color_check
    check (avatar_color in ('sun', 'grass', 'sky', 'card', 'ink'))
);

create unique index members_single_lead_idx on public.members (is_lead) where is_lead;

create trigger members_set_updated_at
  before update on public.members
  for each row execute function private.set_updated_at();

alter table public.members enable row level security;

comment on table public.members is
  'Team members. A member is never deleted: set is_active = false instead.';
comment on column public.members.id is 'Member id.';
comment on column public.members.user_id is
  'Linked auth account (auth.users). Null until the member signs in for the first time.';
comment on column public.members.email is 'Sign-in email (case-insensitive, unique).';
comment on column public.members.display_name is 'Name shown in the UI (1 to 60 characters).';
comment on column public.members.initials is 'Initials shown in the avatar badge (1 to 3 uppercase characters).';
comment on column public.members.avatar_color is 'Avatar badge colour, a design token: sun, grass, sky, card or ink.';
comment on column public.members.is_facilitator is
  'Animateur role: drives the meeting, manages the team. Cumulative with is_lead.';
comment on column public.members.is_lead is
  'Responsable role: reads everyone''s entries before the meeting. One member at most (members_single_lead_idx).';
comment on column public.members.is_active is 'Inactive members can neither read nor write anything.';
comment on column public.members.created_at is 'Creation time.';
comment on column public.members.updated_at is 'Last update time (set by trigger).';
comment on index public.members_single_lead_idx is 'Guarantees a single member with is_lead = true.';

-- ---------------------------------------------------------------------------
-- meetings
-- ---------------------------------------------------------------------------

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null unique,
  entry_deadline timestamptz not null,
  created_at timestamptz not null default now(),
  constraint meetings_date_is_monday check (extract(isodow from meeting_date) = 1)
);

alter table public.meetings enable row level security;

comment on table public.meetings is
  'Weekly meetings, one per Monday. Created server-side with the admin client (step 4).';
comment on column public.meetings.id is 'Meeting id.';
comment on column public.meetings.meeting_date is 'Date of the meeting: always a Monday.';
comment on column public.meetings.entry_deadline is
  'End of the entry window (Monday 10:00 Europe/Paris, computed by the app and stored here).';
comment on column public.meetings.created_at is 'Creation time.';

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  title text not null,
  details text,
  priority smallint not null,
  tag public.topic_tag not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_title_length
    check (char_length(btrim(title)) >= 1 and char_length(title) <= 120),
  constraint topics_details_length
    check (details is null or (char_length(btrim(details)) >= 1 and char_length(details) <= 280)),
  constraint topics_priority_range check (priority between 1 and 5),
  constraint topics_member_priority_unique
    unique (meeting_id, member_id, priority) deferrable initially deferred
);

create index topics_member_id_idx on public.topics (member_id);

create trigger topics_set_updated_at
  before update on public.topics
  for each row execute function private.set_updated_at();

alter table public.topics enable row level security;

comment on table public.topics is
  'Topics a member brings to a meeting: 5 at most per member and meeting (trigger topics_max_five).';
comment on column public.topics.id is 'Topic id.';
comment on column public.topics.meeting_id is 'Meeting the topic is for.';
comment on column public.topics.member_id is 'Member who brings the topic.';
comment on column public.topics.title is 'Title (1 to 120 characters, not blank).';
comment on column public.topics.details is 'Optional details (1 to 280 characters when present).';
comment on column public.topics.priority is
  'Priority 1 (highest) to 5, unique per member and meeting (deferrable, to allow reordering).';
comment on column public.topics.tag is 'Topic tag (see type topic_tag).';
comment on column public.topics.created_at is 'Creation time.';
comment on column public.topics.updated_at is 'Last update time (set by trigger).';
comment on constraint topics_member_priority_unique on public.topics is
  'One topic per priority for a member and a meeting. Deferred: priorities can be swapped in one transaction.';

-- ---------------------------------------------------------------------------
-- visits
-- ---------------------------------------------------------------------------

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  visit_date date not null,
  place text not null,
  purpose text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_place_length
    check (char_length(btrim(place)) >= 1 and char_length(place) <= 120),
  constraint visits_purpose_length
    check (char_length(btrim(purpose)) >= 1 and char_length(purpose) <= 200)
);

create index visits_meeting_id_idx on public.visits (meeting_id);
create index visits_member_id_idx on public.visits (member_id);

create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function private.set_updated_at();

alter table public.visits enable row level security;

comment on table public.visits is
  'Visits and trips of a member during the meeting week (Monday to Sunday). No limit on count.';
comment on column public.visits.id is 'Visit id.';
comment on column public.visits.meeting_id is 'Meeting whose week contains the visit.';
comment on column public.visits.member_id is 'Member who visits or travels.';
comment on column public.visits.visit_date is
  'Date of the visit, within the meeting week (trigger visits_in_meeting_week).';
comment on column public.visits.place is 'Place (1 to 120 characters, not blank).';
comment on column public.visits.purpose is 'Purpose (1 to 200 characters, not blank).';
comment on column public.visits.created_at is 'Creation time.';
comment on column public.visits.updated_at is 'Last update time (set by trigger).';
