-- Good Morning Property — personal access links (no email is ever sent).
-- Each member has a secret link /l/<token>; only the SHA-256 of the token is stored.
-- The token columns are reachable by the admin client (service_role) only.

alter table public.members
  add column access_token_hash text unique,
  add column access_token_created_at timestamptz,
  add constraint members_access_token_hash_format
    check (access_token_hash is null or access_token_hash ~ '^[0-9a-f]{64}$'),
  add constraint members_access_token_consistency
    check ((access_token_hash is null) = (access_token_created_at is null));

comment on column public.members.access_token_hash is
  'SHA-256 (hex) of the member''s personal link token. Null = no valid link. Never readable through the API.';
comment on column public.members.access_token_created_at is
  'When the current personal link was generated. Null when there is no link. Admin client only.';
comment on constraint members_access_token_hash_format on public.members is
  'The stored value is a lowercase hex SHA-256, never the token itself.';
comment on constraint members_access_token_consistency on public.members is
  'A link hash always comes with its creation time, and vice versa.';

-- Column-level SELECT: authenticated users read every column except the token ones.
revoke select on table public.members from authenticated;
grant select (
  id, user_id, email, display_name, initials, avatar_color,
  is_facilitator, is_lead, is_active, created_at, updated_at
) on table public.members to authenticated;
-- INSERT/UPDATE column grants (rls_policies migration) never included the token columns.

-- ---------------------------------------------------------------------------
-- set_lead: move the responsable role in one transaction
-- ---------------------------------------------------------------------------

create function public.set_lead(target_member_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_facilitator() then
    raise exception 'Seul un animateur peut désigner le responsable.'
      using errcode = '42501';
  end if;

  -- Order matters: members_single_lead_idx is not deferrable.
  update public.members
  set is_lead = false
  where is_lead
    and id is distinct from target_member_id;

  if target_member_id is not null then
    update public.members
    set is_lead = true
    where id = target_member_id
      and is_active;

    if not found then
      raise exception 'Ce membre est introuvable ou désactivé.'
        using errcode = 'P0001', hint = 'member_not_found';
    end if;
  end if;
end;
$$;

comment on function public.set_lead(uuid) is
  'Makes target_member_id the only responsable (null: nobody), in one transaction. SECURITY INVOKER: RLS applies, facilitators only.';

revoke all on function public.set_lead(uuid) from public, anon;
grant execute on function public.set_lead(uuid) to authenticated, service_role;
