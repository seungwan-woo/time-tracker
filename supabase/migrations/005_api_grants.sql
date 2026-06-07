-- Make SQL-created public tables visible to Supabase's Data API roles.
-- RLS policies still decide which rows each signed-in user can access.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

-- Ask PostgREST to reload its schema cache after creating tables/policies.
notify pgrst, 'reload schema';
