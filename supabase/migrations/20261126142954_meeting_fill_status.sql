-- Good Morning Property — who has filled in what, without the content.
-- Before the meeting everyone sees counts only; the topics themselves stay behind the RLS.

create function public.meeting_fill_status(meeting_id uuid)
returns table (member_id uuid, topics_count integer, visits_count integer, alerts_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if private.current_member_id() is null then
    raise exception 'Réservé aux membres actifs.' using errcode = '42501';
  end if;

  return query
  select
    m.id,
    (select count(*)::integer from public.topics t
      where t.meeting_id = meeting_fill_status.meeting_id and t.member_id = m.id),
    (select count(*)::integer from public.visits v
      where v.meeting_id = meeting_fill_status.meeting_id and v.member_id = m.id),
    (select count(*)::integer from public.topics t
      where t.meeting_id = meeting_fill_status.meeting_id and t.member_id = m.id and t.tag = 'ALERT')
  from public.members m
  where m.is_active
  order by m.display_name;
end;
$$;

comment on function public.meeting_fill_status(uuid) is
  'For each ACTIVE member: number of topics, visits and alert topics for the meeting. Never any content. SECURITY DEFINER (counts across members), active members only (42501 otherwise).';

revoke all on function public.meeting_fill_status(uuid) from public, anon;
grant execute on function public.meeting_fill_status(uuid) to authenticated, service_role;
