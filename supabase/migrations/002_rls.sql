create or replace function is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from family_members
    where family_id = target_family_id
      and user_id = auth.uid()
  );
$$;

alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table children enable row level security;
alter table wearing_sessions enable row level security;
alter table invite_codes enable row level security;

-- Profiles RLS
create policy "users can read their own profile"
on profiles for select
using (auth.uid() = id);

create policy "users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- Families RLS
create policy "family members can read families"
on families for select
using (is_family_member(id));

create policy "authenticated users can create families"
on families for insert
with check (auth.uid() = created_by);

create policy "family owners can update families"
on families for update
using (
  exists (
    select 1 from family_members
    where family_id = id
      and user_id = auth.uid()
      and role = 'owner'
  )
);

-- Family Members RLS
create policy "family members can read family_members"
on family_members for select
using (is_family_member(family_id));

create policy "authenticated users can join families"
on family_members for insert
with check (auth.uid() = user_id);

-- Children RLS
create policy "family members can read children"
on children for select
using (is_family_member(family_id));

create policy "family members can insert children"
on children for insert
with check (is_family_member(family_id));

create policy "family members can update children"
on children for update
using (is_family_member(family_id));

create policy "family owners can delete children"
on children for delete
using (
  exists (
    select 1 from family_members
    where family_id = children.family_id
      and user_id = auth.uid()
      and role = 'owner'
  )
);

-- Wearing Sessions RLS
create policy "family members can read sessions"
on wearing_sessions for select
using (is_family_member(family_id));

create policy "family members can insert sessions"
on wearing_sessions for insert
with check (is_family_member(family_id));

create policy "family members can update sessions"
on wearing_sessions for update
using (is_family_member(family_id));

create policy "family members can delete sessions"
on wearing_sessions for delete
using (is_family_member(family_id));

-- Invite Codes RLS
create policy "family members can read invite codes"
on invite_codes for select
using (is_family_member(family_id));

create policy "family members can create invite codes"
on invite_codes for insert
with check (is_family_member(family_id));

create policy "authenticated users can update invite codes (redeem)"
on invite_codes for update
to authenticated
using (true);
