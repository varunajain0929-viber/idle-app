-- Idle — Supabase schema.
-- Run once in Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement uses IF NOT EXISTS, CREATE OR REPLACE, or
-- an explicit drop-and-recreate for the constraints.

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

-- Server-side input bounds. The client caps text at 70 chars and why at 80,
-- but a tampered client could send anything; these CHECK constraints make the
-- database the final word on what a "task" is allowed to look like.
alter table public.tasks drop constraint if exists tasks_id_len;
alter table public.tasks drop constraint if exists tasks_text_len;
alter table public.tasks drop constraint if exists tasks_why_len;
alter table public.tasks drop constraint if exists tasks_added_at_len;
alter table public.tasks drop constraint if exists tasks_closed_at_len;
alter table public.tasks drop constraint if exists tasks_reclaimed_range;
alter table public.tasks drop constraint if exists tasks_created_at_range;

alter table public.tasks add constraint tasks_id_len
  check (char_length(id) between 4 and 64);
alter table public.tasks add constraint tasks_text_len
  check (char_length(text) between 1 and 200);
alter table public.tasks add constraint tasks_why_len
  check (char_length(why) between 1 and 200);
alter table public.tasks add constraint tasks_added_at_len
  check (char_length(added_at) between 1 and 16);
alter table public.tasks add constraint tasks_closed_at_len
  check (closed_at is null or char_length(closed_at) between 1 and 16);
alter table public.tasks add constraint tasks_reclaimed_range
  check (reclaimed_min is null or (reclaimed_min between 0 and 24 * 60));
-- created_at is a Date.now() milliseconds value. Anchor it to a sane window
-- (year 2000 onwards, no further than 100 years into the future).
alter table public.tasks add constraint tasks_created_at_range
  check (created_at between 946684800000 and 4102444800000);

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

-- Per-user row cap. Prevents a tampered client from filling up the table.
-- We allow generous headroom (1,000 rows / user) — well above what a real
-- person produces, well below "abuse".
create or replace function public.tasks_enforce_row_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
begin
  select count(*) into total from public.tasks where user_id = new.user_id;
  if total >= 1000 then
    raise exception 'task row cap reached';
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_enforce_row_cap on public.tasks;
create trigger tasks_enforce_row_cap
  before insert on public.tasks
  for each row execute function public.tasks_enforce_row_cap();
