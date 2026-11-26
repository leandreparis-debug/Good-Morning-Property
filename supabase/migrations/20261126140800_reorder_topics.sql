-- Good Morning Property — reorder a member's topics in one transaction.

create function public.reorder_topics(meeting_id uuid, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := private.current_member_id();
  own_count integer;
begin
  if me is null then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  if not private.is_entry_open(reorder_topics.meeting_id) then
    raise exception 'La saisie est fermée pour cette réunion.'
      using errcode = 'P0001', hint = 'entry_closed';
  end if;

  select count(*) into own_count
  from public.topics t
  where t.meeting_id = reorder_topics.meeting_id
    and t.member_id = me;

  -- The new order must list every own topic of this meeting exactly once, and nothing else.
  if ordered_ids is null
     or cardinality(ordered_ids) <> own_count
     or (select count(distinct x) from unnest(ordered_ids) as x) <> own_count
     or exists (
       select 1
       from unnest(ordered_ids) as x(id)
       where not exists (
         select 1
         from public.topics t
         where t.id = x.id
           and t.meeting_id = reorder_topics.meeting_id
           and t.member_id = me
       )
     ) then
    raise exception 'Le nouvel ordre ne correspond pas à tes sujets : recharge la page.'
      using errcode = 'P0001', hint = 'invalid_topic_order';
  end if;

  -- topics_member_priority_unique is deferred: the swap is checked at commit.
  update public.topics t
  set priority = o.position
  from unnest(ordered_ids) with ordinality as o(id, position)
  where t.id = o.id
    and t.priority is distinct from o.position;
end;
$$;

comment on function public.reorder_topics(uuid, uuid[]) is
  'Rewrites the priorities (1..n) of the current member''s topics for a meeting, in the given order, in one transaction. SECURITY INVOKER: RLS applies; refused after the entry deadline (P0001 entry_closed) or if the list is not exactly the member''s topics (P0001 invalid_topic_order).';

revoke all on function public.reorder_topics(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_topics(uuid, uuid[]) to authenticated, service_role;
