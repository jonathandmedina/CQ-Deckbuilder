-- Scratch-only mock of the Supabase pieces the access SQL relies on. Never run on Supabase.
create role anon; create role authenticated;
create schema auth;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now(), last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('mock.uid', true), '')::uuid $$;
create table public.deck_results(id bigserial primary key, game_id text, side int, user_id uuid, created_at timestamptz default now());
