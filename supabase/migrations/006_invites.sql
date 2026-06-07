alter table invite_codes
add column if not exists invited_email text;

create or replace function public.redeem_invite_code(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_invite record;
begin
  if current_user_id is null then
    return false;
  end if;

  select id, family_id
  into target_invite
  from invite_codes
  where code = invite_code
    and used_at is null
    and expires_at > now()
  limit 1;

  if target_invite.id is null then
    return false;
  end if;

  insert into family_members (family_id, user_id, role)
  values (target_invite.family_id, current_user_id, 'parent')
  on conflict (family_id, user_id) do nothing;

  update invite_codes
  set used_by = current_user_id,
      used_at = now()
  where id = target_invite.id;

  return true;
end;
$$;

grant execute on function public.redeem_invite_code(text) to authenticated;

notify pgrst, 'reload schema';
