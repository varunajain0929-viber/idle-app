-- Pre-launch security hardening for public.tasks.
-- Adds server-side length checks on every user-controlled column, anchors the
-- created_at timestamp to a sane window, and installs a per-user row-count cap
-- so a tampered client cannot fill the table.

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
-- created_at is a Date.now() millisecond value. Anchor to year 2000 .. 2100.
alter table public.tasks add constraint tasks_created_at_range
  check (created_at between 946684800000 and 4102444800000);

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
