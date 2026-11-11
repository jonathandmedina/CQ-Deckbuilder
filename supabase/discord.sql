-- Update 30: Discord name on public profiles. Run once in Supabase → SQL Editor.
alter table public.profiles add column if not exists discord_name text;
alter table public.profiles add column if not exists discord_public boolean not null default true;
