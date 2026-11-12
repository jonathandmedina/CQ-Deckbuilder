-- Crystal Quest Deck Forge: Trials module access (Nov 12, 2026)
-- Run once in the Supabase SQL editor (project usrxpbefgmdovbqroymv), after the Admin Panel SQL. Safe to run again.
-- Trials access is a row in public.set_access with set_id = 3 (Set 2 uses set_id = 2). Admins always have it.

-- 1) What the signed-in player may see (adds "trials")
create or replace function public.my_access() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'admin',  exists (select 1 from public.admins where user_id = auth.uid()),
    'set2',   exists (select 1 from public.admins where user_id = auth.uid())
           or exists (select 1 from public.set_access where user_id = auth.uid() and set_id = 2),
    'trials', exists (select 1 from public.admins where user_id = auth.uid())
           or exists (select 1 from public.set_access where user_id = auth.uid() and set_id = 3));
$$;
grant execute on function public.my_access() to anon, authenticated;

-- 2) Users list for the Admin page (adds a trials column; the return type changes, so drop first)
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (id uuid, email text, name text, created_at timestamptz, last_sign_in_at timestamptz,
               is_admin boolean, set2 boolean, trials boolean, games bigint, last_game timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
  select u.id, u.email::text,
    coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))::text,
    u.created_at, u.last_sign_in_at,
    exists (select 1 from public.admins a where a.user_id = u.id),
    exists (select 1 from public.set_access s where s.user_id = u.id and s.set_id = 2),
    exists (select 1 from public.set_access s where s.user_id = u.id and s.set_id = 3),
    (select count(distinct r.game_id) from public.deck_results r where r.user_id = u.id),
    (select max(r.created_at) from public.deck_results r where r.user_id = u.id)
  from auth.users u
  order by u.created_at;
end $$;
grant execute on function public.admin_list_users() to authenticated;

-- 3) Give / take Trials access
create or replace function public.admin_set_trials(target uuid, allow boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if allow then
    insert into public.set_access(user_id, set_id, granted_by) values (target, 3, auth.uid()) on conflict do nothing;
  else
    delete from public.set_access where user_id = target and set_id = 3;
  end if;
end $$;
grant execute on function public.admin_set_trials(uuid, boolean) to authenticated;
