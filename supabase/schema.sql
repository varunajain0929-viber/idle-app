-- Idle — Supabase schema.
-- Run once in Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement uses IF NOT EXISTS or CREATE OR REPLACE.

create table if not exists public.tasks (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  text          text not null,
  why           text not null,
  status        text not null check (status in ('open', 'done', 'refused', 'burned')),
  created_at    bigint not null,
  added_at      text not null,
  closed_at     text,
  reclaimed_min int,
  updated_at    timestamptz not null default now()
);

create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_updated_idx on public.tasks (user_id, updated_at desc);

alter table public.tasks enable row level security;

drop policy if exists "own select" on public.tasks;
drop policy if exists "own insert" on public.tasks;
drop policy if exists "own update" on public.tasks;
drop policy if exists "own delete" on public.tasks;

create policy "own select" on public.tasks
  for select using (auth.uid() = user_id);

create policy "own insert" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "own update" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own delete" on public.tasks
  for delete using (auth.uid() = user_id);

-- Auto-bump updated_at on every UPDATE so last-write-wins merging works.
create or replace function public.tasks_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.tasks_set_updated_at();
