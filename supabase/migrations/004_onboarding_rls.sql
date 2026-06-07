-- Allow a family creator to read the newly-created family before the
-- family_members row exists. This is needed for insert(...).select("id").
create policy "family creators can read their own families"
on families for select
using ((select auth.uid()) = created_by);

-- Allow signed-in users to create their profile if the auth trigger did not
-- run for an existing account.
create policy "users can create their own profile"
on profiles for insert
with check ((select auth.uid()) = id);
