-- Scratch-only test for supabase/trials_access.sql. Run after mock_base.sql + Admin Panel SQL + trials_access.sql.
\set ON_ERROR_STOP 1
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','admin@x'),('00000000-0000-0000-0000-00000000000b','player@x') on conflict do nothing;
insert into public.admins(user_id) values ('00000000-0000-0000-0000-00000000000a') on conflict do nothing;
do $$ declare ok boolean; begin
  perform set_config('mock.uid','00000000-0000-0000-0000-00000000000b',false);
  if (public.my_access()->>'trials')::boolean then raise exception 'FAIL: player sees Trials before grant'; end if;
  begin perform public.admin_set_trials('00000000-0000-0000-0000-00000000000b', true); raise exception 'FAIL: non-admin could grant';
  exception when others then if sqlerrm not like '%Admins only%' then raise; end if; end;
  perform set_config('mock.uid','00000000-0000-0000-0000-00000000000a',false);
  if not (public.my_access()->>'trials')::boolean then raise exception 'FAIL: admin without row cannot see Trials'; end if;
  perform public.admin_set_trials('00000000-0000-0000-0000-00000000000b', true);
  select u.trials into ok from public.admin_list_users() u where u.id='00000000-0000-0000-0000-00000000000b';
  if not ok then raise exception 'FAIL: admin_list_users trials false after grant'; end if;
  select u.set2 into ok from public.admin_list_users() u where u.id='00000000-0000-0000-0000-00000000000b';
  if ok then raise exception 'FAIL: Trials grant leaked into Set 2'; end if;
  perform set_config('mock.uid','00000000-0000-0000-0000-00000000000b',false);
  if not (public.my_access()->>'trials')::boolean then raise exception 'FAIL: player cannot see Trials after grant'; end if;
  if (public.my_access()->>'set2')::boolean then raise exception 'FAIL: player got Set 2 from Trials grant'; end if;
  perform set_config('mock.uid','00000000-0000-0000-0000-00000000000a',false);
  perform public.admin_set_trials('00000000-0000-0000-0000-00000000000b', false);
  perform set_config('mock.uid','00000000-0000-0000-0000-00000000000b',false);
  if (public.my_access()->>'trials')::boolean then raise exception 'FAIL: player still sees Trials after removal'; end if;
  perform set_config('mock.uid','',false);
  if (public.my_access()->>'trials')::boolean then raise exception 'FAIL: signed-out sees Trials'; end if;
  raise notice 'PASS: trials access';
end $$;
