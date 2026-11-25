-- Game Logs & Sideboards SQL (Nov 24, 2026). Run once in Supabase → SQL Editor. Safe to run again.
-- 1) game_logs: one row per finished Play-tab game (vs AI or online), written by the vs-AI player's or the room host's browser.
--    Holds the seed, both decks, every action and the game log, so admins can replay a game, file bugs and train the AI.
create table if not exists public.game_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  game_id text unique,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  mode text,
  players jsonb,
  winner int,
  rounds int,
  ver text,
  setup jsonb,
  actions jsonb,
  log jsonb,
  ended text,
  match_id text,
  game_no int,
  constraint game_logs_size check (pg_column_size(actions) + pg_column_size(log) + pg_column_size(setup) < 2000000)
);
create index if not exists game_logs_created on public.game_logs (created_at desc);
create index if not exists game_logs_match on public.game_logs (match_id);
alter table public.game_logs enable row level security;
drop policy if exists "game_logs insert" on public.game_logs;
create policy "game_logs insert" on public.game_logs for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
drop policy if exists "game_logs admin read" on public.game_logs;
create policy "game_logs admin read" on public.game_logs for select to authenticated using (public.is_admin());
drop policy if exists "game_logs admin delete" on public.game_logs;
create policy "game_logs admin delete" on public.game_logs for delete to authenticated using (public.is_admin());

-- 2) decks.side: the Best-of-3 sideboard ({heroes:[...], cards:{...}}), up to 10 cards counting 1 Hero.
alter table public.decks add column if not exists side jsonb;
